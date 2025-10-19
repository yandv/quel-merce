import type { HttpContext } from '@adonisjs/core/http'
import Coupon from '#models/coupon'
import CouponNotFoundException from '#exceptions/coupon/coupon_not_found_exception'
import CouponExpiredException from '#exceptions/coupon/coupon_expired_exception'
import CouponUsageLimitExceededException from '#exceptions/coupon/coupon_usage_limit_exceeded_exception'
import CouponInactiveException from '#exceptions/coupon/coupon_inactive_exception'
import { DateTime } from 'luxon'
import {
  couponQueryValidator,
  couponValidator,
  createCouponValidator,
  couponIdValidator,
  updateCouponValidator,
} from '#validators/coupon_validator'
import { sortAndPaginationValidator } from '#validators/default_validators'
import CouponNewUsageLimitEqualsOrLowerThanUsageCountException from '#exceptions/coupon/coupon_new_usage_limit_equals_or_lower_than_usage_count_exception'
import db from '@adonisjs/lucid/services/db'

export default class CouponsController {
  async getCouponByCode({ params, response }: HttpContext) {
    const { code } = await couponValidator.validate(params)

    const coupon = await Coupon.findBy('code', code.toUpperCase())

    if (!coupon) {
      throw new CouponNotFoundException()
    }

    if (!coupon.isActive) {
      throw new CouponInactiveException()
    }

    const now = DateTime.now()

    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new CouponExpiredException()
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new CouponUsageLimitExceededException()
    }

    return response.status(200).json(coupon)
  }

  async getCoupons({ request, response }: HttpContext) {
    const { name, active } = await couponQueryValidator.validate(request.all())
    const {
      sort,
      page = 1,
      itemsPerPage = 10,
    } = await sortAndPaginationValidator.validate(request.all())

    const query = Coupon.query()

    if (name) {
      query.whereRaw('LOWER(UNACCENT(code)) LIKE ?', [`%${name.toLowerCase()}%`])
    }

    if (active !== undefined) {
      query.where('isActive', active)
    }

    if (sort) {
      query.orderBy(sort.map((item) => ({ column: item.field, order: item.order })))
    }

    const coupons = await query.paginate(page, itemsPerPage)

    return response.json(coupons)
  }

  async getCouponSummary({ response }: HttpContext) {
    const now = DateTime.now()
    const sevenDaysLater = now.plus({ days: 7 }).toJSDate()
    const last30Days = now.minus({ days: 30 }).toJSDate()

    const [stats] = await db.from('coupons as c').select(
      db.raw('COUNT(*)::int as total'),
      db.raw(`SUM(CASE WHEN c.is_active = true THEN 1 ELSE 0 END)::int as active`),
      db.raw(`SUM(CASE WHEN c.valid_until < ? THEN 1 ELSE 0 END)::int as expiring_in_7_days`, [
        sevenDaysLater,
      ]),
      db.raw(
        `(
          SELECT COUNT(*) 
          FROM orders o 
          WHERE o.created_at >= ? 
            AND o.coupon_id IS NOT NULL
        )::int as usages_this_month`,
        [last30Days]
      )
    )

    return response.json({
      total: stats.total || 0,
      active: stats.active || 0,
      expiringIn7Days: stats.expiring_in_7_days || 0,
      usagesThisMonth: stats.usages_this_month || 0,
    })
  }

  async createCoupon({ request, response }: HttpContext) {
    const data = await createCouponValidator.validate(request.all())

    const coupon = await Coupon.create({
      ...data,
      validFrom: DateTime.fromJSDate(data.validFrom),
      validUntil: DateTime.fromJSDate(data.validUntil),
    })

    return response.status(201).json(coupon)
  }

  async updateCouponById({ params, request, response }: HttpContext) {
    const { id } = await couponIdValidator.validate(params)
    const data = await request.validateUsing(updateCouponValidator)

    const coupon = await Coupon.findOrFail(id)

    if (
      data.usageLimit &&
      Number.isInteger(data.usageLimit) &&
      coupon.usageCount >= data.usageLimit
    ) {
      throw new CouponNewUsageLimitEqualsOrLowerThanUsageCountException()
    }

    coupon.merge({
      ...data,
      validFrom: data.validFrom ? DateTime.fromJSDate(data.validFrom) : coupon.validFrom,
      validUntil: data.validUntil ? DateTime.fromJSDate(data.validUntil) : coupon.validUntil,
    })
    await coupon.save()

    return response.json(coupon)
  }

  async deleteCouponById({ params, response }: HttpContext) {
    const { id } = await couponIdValidator.validate(params)
    const coupon = await Coupon.findOrFail(id)

    await coupon.delete()
    return response.status(204)
  }
}
