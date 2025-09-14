import type { HttpContext } from '@adonisjs/core/http'
import { createOrderValidator, orderIdValidator } from '#validators/order_validator'
import Order, { OrderPaymentStatus, PaymentMethod } from '#models/order'
import Product from '#models/product'
import PaymentMethodNotSupportedException from '#exceptions/payment/payment_method_not_supported_exception'
import OrderNotFoundException from '#exceptions/order/order_not_found_exception'

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

    const order = await Order.create({
      userId: user?.id,
      paymentMethod,
      paymentStatus: OrderPaymentStatus.PENDING,
      couponId: couponId,
    })

    await order.related('items').createMany(
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: products.find((product) => product.id === item.productId)?.price ?? 0,
      }))
    )

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
