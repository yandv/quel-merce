import type { HttpContext } from '@adonisjs/core/http'
import { createOrderValidator, orderIdValidator } from '#validators/order_controller'
import Order, { OrderPaymentStatus, PaymentMethod } from '#models/order'
import Product from '#models/product'
import PaymentMethodNotSupportedException from '#exceptions/payment_method_not_supported_exception'
import ProductNotFoundException from '#exceptions/product_not_found_exception'
import OrderNotFoundException from '#exceptions/order_not_found_exception'

export default class OrderController {
  async createOrder({ request, response, auth }: HttpContext) {
    const { items, paymentMethod } = await createOrderValidator.validate(request.all())

    if (paymentMethod !== PaymentMethod.PIX) {
      throw new PaymentMethodNotSupportedException(paymentMethod)
    }

    const user = auth.user

    const products = await Product.query().whereIn(
      'id',
      items.map((item) => item.productId)
    )

    if (products.length !== items.length) {
      const foundProductIds = products.map((product) => product.id)
      const missingProductIds = items
        .map((item) => item.productId)
        .filter((id) => !foundProductIds.includes(id))
      throw new ProductNotFoundException(missingProductIds)
    }

    const order = await Order.create({
      userId: user?.id,
      paymentMethod,
      paymentStatus: OrderPaymentStatus.PENDING,
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
      .first()

    if (!order) {
      throw new OrderNotFoundException(id)
    }

    return response.status(200).json(order)
  }
}
