import type { HttpContext } from '@adonisjs/core/http'
import Coupon from '#models/coupon'
import CouponNotFoundException from '#exceptions/coupon/coupon_not_found_exception'
import CouponExpiredException from '#exceptions/coupon/coupon_expired_exception'
import CouponUsageLimitExceededException from '#exceptions/coupon/coupon_usage_limit_exceeded_exception'
import CouponMinimumOrderValueNotMetException from '#exceptions/coupon/coupon_minimum_order_value_not_met_exception'
import CouponInactiveException from '#exceptions/coupon/coupon_inactive_exception'
import { DateTime } from 'luxon'
import { couponValidator } from '#validators/coupon_validator'

export default class CouponsController {
  async validateCoupon({ request, response }: HttpContext) {
    const { code, orderTotal } = await request.validateUsing(couponValidator)

    const coupon = await Coupon.findBy('code', code.toUpperCase())

    if (!coupon) {
      throw new CouponNotFoundException()
    }

    if (!coupon.isActive) {
      throw new CouponInactiveException()
    }

    // Validar se o cupom está dentro do período de validade
    const now = DateTime.now()
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new CouponExpiredException()
    }

    // Validar se o cupom não atingiu o limite de uso
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new CouponUsageLimitExceededException()
    }

    // Validar se o valor do pedido atende ao mínimo
    if (orderTotal < coupon.minimumOrderValue) {
      throw new CouponMinimumOrderValueNotMetException(coupon.minimumOrderValue)
    }

    // Calcular desconto
    let discount = 0

    if (coupon.discountType === 'PERCENTAGE') {
      discount = (orderTotal * coupon.discountValue) / 100
    } else {
      discount = coupon.discountValue
    }

    // Aplicar desconto máximo se definido
    if (coupon.maximumDiscount !== null && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount
    }

    // Não permitir desconto maior que o valor do pedido
    if (discount > orderTotal) {
      discount = orderTotal
    }

    // Arredondar para 2 casas decimais
    discount = Math.round(discount * 100) / 100

    const finalTotal = orderTotal - discount

    return response.status(200).json({
      message: 'Cupom válido',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumOrderValue: coupon.minimumOrderValue,
        maximumDiscount: coupon.maximumDiscount,
      },
      discount,
      finalTotal,
      orderTotal,
    })
  }

  async applyCoupon({ request, response }: HttpContext) {
    const { code, orderId } = request.only(['code', 'orderId'])

    if (!code || !orderId) {
      return response.status(400).json({
        message: 'Código do cupom e ID do pedido são obrigatórios',
      })
    }

    const coupon = await Coupon.findBy('code', code.toUpperCase())

    if (!coupon) {
      throw new CouponNotFoundException()
    }

    return response.status(200).json({
      message: 'Cupom aplicado com sucesso',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    })
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
