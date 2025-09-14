import type { HttpContext } from '@adonisjs/core/http'
import Coupon from '#models/coupon'
import CouponNotFoundException from '#exceptions/coupon/coupon_not_found_exception'
import CouponExpiredException from '#exceptions/coupon/coupon_expired_exception'
import CouponUsageLimitExceededException from '#exceptions/coupon/coupon_usage_limit_exceeded_exception'
import CouponInactiveException from '#exceptions/coupon/coupon_inactive_exception'
import { DateTime } from 'luxon'
import { couponValidator } from '#validators/coupon_validator'

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

  // Métodos administrativos (para criar/gerenciar cupons)
  async index({ response }: HttpContext) {
    const coupons = await Coupon.all()
    return response.json(coupons)
  }

  async store({ request, response }: HttpContext) {
    const data = request.only([
      'code',
      'description',
      'discountType',
      'discountValue',
      'minimumOrderValue',
      'maximumDiscount',
      'usageLimit',
      'validFrom',
      'validUntil',
    ])

    const coupon = await Coupon.create(data)
    return response.status(201).json(coupon)
  }

  async show({ params, response }: HttpContext) {
    const coupon = await Coupon.find(params.id)
    if (!coupon) {
      throw new CouponNotFoundException()
    }
    return response.json(coupon)
  }

  async update({ params, request, response }: HttpContext) {
    const coupon = await Coupon.find(params.id)

    if (!coupon) {
      throw new CouponNotFoundException()
    }

    const data = request.only([
      'code',
      'description',
      'discountType',
      'discountValue',
      'minimumOrderValue',
      'maximumDiscount',
      'usageLimit',
      'isActive',
      'validFrom',
      'validUntil',
    ])

    coupon.merge(data)
    await coupon.save()

    return response.json(coupon)
  }

  async destroy({ params, response }: HttpContext) {
    const coupon = await Coupon.find(params.id)

    if (!coupon) {
      throw new CouponNotFoundException()
    }

    await coupon.delete()
    return response.status(204)
  }
}
