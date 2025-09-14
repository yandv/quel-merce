import type { HttpContext } from '@adonisjs/core/http'
import { createOrderValidator, orderIdValidator } from '#validators/order_validator'
import Order, { OrderPaymentStatus, PaymentMethod } from '#models/order'
import Product from '#models/product'
import PaymentMethodNotSupportedException from '#exceptions/payment/payment_method_not_supported_exception'
import OrderNotFoundException from '#exceptions/order/order_not_found_exception'
import Coupon, { CouponDiscountType } from '#models/coupon'
import CouponNotFoundException from '#exceptions/coupon/coupon_not_found_exception'
import CouponInactiveException from '#exceptions/coupon/coupon_inactive_exception'
import CouponExpiredException from '#exceptions/coupon/coupon_expired_exception'
import { DateTime } from 'luxon'
import CouponUsageLimitExceededException from '#exceptions/coupon/coupon_usage_limit_exceeded_exception'
import db from '@adonisjs/lucid/services/db'

export default class OrderController {
  async createOrder({ request, response, auth }: HttpContext) {
    const { items, paymentMethod, couponId } = await request.validateUsing(createOrderValidator)

    if (paymentMethod !== PaymentMethod.PIX) {
      throw new PaymentMethodNotSupportedException(paymentMethod)
    }

    const user = auth.user

    const products = await Product.query().whereIn(
      'id',
      items.map((item) => item.productId)
    )
    const subtotal = products.reduce(
      (acc, product) =>
        acc + product.price * items.find((item) => item.productId === product.id)!.quantity,
      0
    )

    let coupon: Coupon | null = null

    let total = subtotal
    let discount = 0

    if (couponId) {
      coupon = await Coupon.find(couponId)

      if (!coupon) {
        throw new CouponNotFoundException()
      }

      if (!coupon.isActive) {
        throw new CouponInactiveException()
      }

      if (coupon.validFrom > DateTime.now() || coupon.validUntil < DateTime.now()) {
        throw new CouponExpiredException()
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new CouponUsageLimitExceededException()
      }

      if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
        discount = (subtotal * coupon.discountValue) / 100
      } else {
        discount = coupon.discountValue ?? 0
      }

      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount
      }

      if (coupon.minimumOrderValue && subtotal < coupon.minimumOrderValue) {
        discount = 0
      }

      discount = Math.min(discount, subtotal)

      total = subtotal - discount
    }

    const paymentStatus = total <= 0 ? OrderPaymentStatus.PAID : OrderPaymentStatus.PENDING

    const order = await db.transaction(async (trx) => {
      const createdOrder = await Order.create(
        {
          userId: user?.id,
          paymentMethod,
          paymentStatus,
          couponId: coupon?.id ?? null,
          total,
          discount,
        },
        { client: trx }
      )

      await createdOrder.related('items').createMany(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: products.find((product) => product.id === item.productId)?.price ?? 0,
        })),
        {
          client: trx,
        }
      )

      if (coupon && discount > 0) {
        const updatedRows = await Coupon.query({ client: trx })
          .where('id', coupon.id)
          .where((query) => {
            query
              .whereNull('usage_limit')
              .orWhere('usage_limit', 0)
              .orWhereRaw('"usage_count" < "usage_limit"')
          })
          .increment('usageCount', 1)

        if (updatedRows.length === 0) {
          throw new CouponUsageLimitExceededException()
        }
      }

      return createdOrder
    })

    return response.status(201).json(order)
  }

  async getOrderById({ params, response, auth }: HttpContext) {
    const { id } = await orderIdValidator.validate(params)

    const order = await Order.query()
      .where('id', id)
      .andWhere('userId', auth.user!.id)
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
      .preload('coupon')
      .first()

    if (!order) {
      throw new OrderNotFoundException(id)
    }

    return response.status(200).json(order)
  }
}
