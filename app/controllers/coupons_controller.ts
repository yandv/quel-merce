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
import Order from '#models/order'
import CouponNewUsageLimitEqualsOrLowerThanUsageCountException from '#exceptions/coupon/coupon_new_usage_limit_equals_or_lower_than_usage_count_exception'

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

    return response.json({
      data: coupons,
      pagination: {
        page,
        itemsPerPage,
        total: coupons.total,
        totalPages: coupons.lastPage,
      },
    })
  }

  async getCouponSummary({ response }: HttpContext) {
    const [
      [totalCouponsCount],
      [activeCouponsCount],
      [expiringIn7DaysCouponsCount],
      [usagesThisMonthCouponsCount],
    ] = await Promise.all([
      Coupon.query().count('* as total').pojo<{ total: number }>(),
      Coupon.query().where('isActive', true).count('* as total').pojo<{ total: number }>(),
      Coupon.query()
        .where('validUntil', '<', DateTime.now().plus({ days: 7 }).toJSDate())
        .count('* as total')
        .pojo<{ total: number }>(),
      Order.query()
        .where('createdAt', '>=', DateTime.now().minus({ days: 30 }).toJSDate())
        .whereNotNull('couponId')
        .count('* as total')
        .pojo<{ total: number }>(),
    ])

    return response.json({
      total: Number(totalCouponsCount?.total) || 0,
      active: Number(activeCouponsCount?.total) || 0,
      expiringIn7Days: Number(expiringIn7DaysCouponsCount?.total) || 0,
      usagesThisMonth: Number(usagesThisMonthCouponsCount?.total) || 0,
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
