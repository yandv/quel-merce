import type { HttpContext } from '@adonisjs/core/http'
import {
  createOrderValidator,
  orderIdValidator,
  orderQueryValidator,
  cancelOrderValidator,
} from '#validators/order_validator'
import vine from '@vinejs/vine'
import Order, { OrderPaymentStatus, PaymentMethod } from '#models/order'
import Product from '#models/product'
import PaymentMethodNotSupportedException from '#exceptions/payment/payment_method_not_supported_exception'
import OrderNotFoundException from '#exceptions/order/order_not_found_exception'
import OrderAlreadyCancelledException from '#exceptions/order/order_already_cancelled_exception'
import OrderCannotBeModifiedException from '#exceptions/order/order_cannot_be_modified_exception'
import AccessDeniedException from '#exceptions/auth/access_denied_exception'
import Coupon, { CouponDiscountType } from '#models/coupon'
import CouponNotFoundException from '#exceptions/coupon/coupon_not_found_exception'
import CouponInactiveException from '#exceptions/coupon/coupon_inactive_exception'
import CouponExpiredException from '#exceptions/coupon/coupon_expired_exception'
import { DateTime } from 'luxon'
import CouponUsageLimitExceededException from '#exceptions/coupon/coupon_usage_limit_exceeded_exception'
import db from '@adonisjs/lucid/services/db'
import { sortAndPaginationValidator, includesValidator } from '#validators/default_validators'
import { UserRole } from '#models/user'
import { EmailService } from '#services/email_service'
import { PaymentManagerService } from '#services/payment_manager_service'
import { inject } from '@adonisjs/core'

@inject()
export default class OrderController {
  constructor(
    private emailService: EmailService,
    private paymentManagerService: PaymentManagerService
  ) {}
  /**
   * GET /api/orders
   * Lista pedidos com paginação, filtros e ordenação
   */
  async getOrders({ request, response }: HttpContext) {
    const { search, paymentStatus, paymentMethod, dateFrom, dateTo } =
      await orderQueryValidator.validate(request.all())
    const { includes = [] } = await includesValidator.validate(request.all())
    const {
      sort,
      page = 1,
      itemsPerPage = 10,
    } = await sortAndPaginationValidator.validate(request.all())

    const query = Order.query()

    if (includes.includes('user')) {
      query.preload('user', (userQuery) => {
        userQuery.select('id', 'fullName', 'email')
      })
    }

    if (includes.includes('items')) {
      query.preload('items', (itemsQuery) => {
        itemsQuery.preload('product', (productQuery) => {
          productQuery.select('id', 'name', 'thumbnailUrl', 'price')
        })
      })
    }

    if (includes.includes('coupon')) {
      query.preload('coupon', (couponQuery) => {
        couponQuery.select('id', 'code', 'discountType', 'discountValue')
      })
    }

    if (search) {
      query.where((searchQuery) => {
        searchQuery.where('id', 'like', `%${search}%`).orWhereHas('user', (userQuery) => {
          userQuery
            .whereRaw('LOWER(UNACCENT(full_name)) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(UNACCENT(email)) LIKE ?', [`%${search.toLowerCase()}%`])
        })
      })
    }

    if (paymentStatus) {
      query.where('paymentStatus', paymentStatus)
    }

    if (paymentMethod) {
      query.where('paymentMethod', paymentMethod)
    }

    if (dateFrom) {
      query.where('createdAt', '>=', DateTime.fromISO(dateFrom).toSQL()!)
    }

    if (dateTo) {
      query.where('createdAt', '<=', DateTime.fromISO(dateTo).toSQL()!)
    }

    if (sort) {
      query.orderBy(sort.map((item) => ({ column: item.field, order: item.order })))
    } else {
      query.orderBy('createdAt', 'desc')
    }

    const orders = await query.paginate(page, itemsPerPage)

    return response.json(orders)
  }

  async createOrder({ request, response, auth }: HttpContext) {
    const { items, paymentMethod, couponId } = await request.validateUsing(createOrderValidator)

    const supportedMethods = [PaymentMethod.PIX, PaymentMethod.MERCADO_PAGO, PaymentMethod.STRIPE]

    if (!supportedMethods.includes(paymentMethod)) {
      throw new PaymentMethodNotSupportedException(paymentMethod)
    }

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
          userId: auth.user!.id,
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

    await order.load('user')
    await order.load('items', (itemsQuery) => {
      itemsQuery.preload('product')
    })

    if (order.paymentStatus === OrderPaymentStatus.PENDING) {
      try {
        await this.paymentManagerService.createPaymentForOrder(order)
      } catch (error) {
        console.error('Erro ao gerar pagamento:', error)
      }
    }

    await order.load('payment')

    await this.emailService.sendOrderConfirmationEmail(auth.user!, order)

    return response.status(201).json(order)
  }

  /**
   * PATCH /api/orders/:id/cancel (Admin)
   * Cancela um pedido com motivo
   */
  async cancelOrder({ params, request, response }: HttpContext) {
    const { id } = await orderIdValidator.validate(params)
    const { reason } = await request.validateUsing(cancelOrderValidator)

    const order = await Order.find(id)
    if (!order) {
      throw new OrderNotFoundException(id)
    }

    if (order.paymentStatus === OrderPaymentStatus.CANCELLED) {
      throw new OrderAlreadyCancelledException()
    }

    const originalStatus = order.paymentStatus
    const wasPaid = originalStatus === OrderPaymentStatus.PAID

    if (originalStatus === OrderPaymentStatus.PAID) {
      order.paymentStatus = OrderPaymentStatus.CHARGED_BACK
    } else {
      order.paymentStatus = OrderPaymentStatus.CANCELLED
    }
    await order.save()

    await order.load('user')
    await order.load('items', (itemsQuery) => {
      itemsQuery.preload('product')
    })

    await this.emailService.sendOrderCancellationEmail(order.user, order, reason, wasPaid)

    return response.json({
      message: 'Pedido cancelado com sucesso',
      order: order,
    })
  }

  async getOrderById({ params, request, response, auth }: HttpContext) {
    const { id } = await orderIdValidator.validate(params)
    const { includes = [] } = await includesValidator.validate(request.all())

    const query = Order.query().where('id', id)

    if (includes.includes('items')) {
      query.preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
    }

    if (includes.includes('coupon')) {
      query.preload('coupon')
    }

    if (includes.includes('user')) {
      query.preload('user')
    }

    if (includes.includes('payment')) {
      query.preload('payment')
    }

    if (auth.user?.role !== UserRole.CUSTOMER) {
      query.where('userId', auth.user!.id)
    }

    const order = await query.first()

    if (!order) {
      throw new OrderNotFoundException(id)
    }

    return response.status(200).json(order)
  }

  /**
   * GET /api/orders/summary
   * Estatísticas gerais dos pedidos
   */
  async getOrderSummary({ response }: HttpContext) {
    const [stats] = await db
      .from('orders as o')
      .select(
        db.raw('COUNT(*)::int as total'),
        db.raw("SUM(CASE WHEN o.payment_status = 'PAID' THEN 1 ELSE 0 END)::int as completed"),
        db.raw("SUM(CASE WHEN o.payment_status = 'PENDING' THEN 1 ELSE 0 END)::int as pending"),
        db.raw("SUM(CASE WHEN o.payment_status = 'CANCELLED' THEN 1 ELSE 0 END)::int as cancelled"),
        db.raw(
          "SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total ELSE 0 END)::float as total_revenue"
        )
      )

    return response.json({
      total: stats.total || 0,
      completed: stats.completed || 0,
      pending: stats.pending || 0,
      cancelled: stats.cancelled || 0,
      totalRevenue: stats.total_revenue || 0,
    })
  }

  /**
   * PATCH /api/orders/:id/payment-method
   * Altera o método de pagamento de um pedido
   */
  async updatePaymentMethod({ params, request, response, auth }: HttpContext) {
    const { id } = await orderIdValidator.validate(params)
    const { paymentMethod } = await request.validateUsing(
      vine.compile(
        vine.object({
          paymentMethod: vine.enum(PaymentMethod),
        })
      )
    )

    const order = await Order.find(id)
    if (!order) {
      throw new OrderNotFoundException(id)
    }

    if (auth.user?.role !== UserRole.CUSTOMER && order.userId !== auth.user?.id) {
      throw new AccessDeniedException()
    }

    if (order.paymentStatus !== OrderPaymentStatus.PENDING) {
      throw new OrderCannotBeModifiedException()
    }

    order.paymentMethod = paymentMethod
    await order.save()

    const existingPayment = await order.related('payment').query().first()

    if (existingPayment) {
      try {
        await this.paymentManagerService.cancelPayment(existingPayment.id)
      } catch (error) {
        console.error('Erro ao cancelar pagamento existente:', error)
      }
    }

    try {
      await this.paymentManagerService.createPaymentForOrder(order)
      await order.load('payment')
    } catch (error) {
      console.error('Erro ao criar novo pagamento:', error)
    }

    return response.json({
      message: 'Método de pagamento alterado com sucesso',
      order: order,
    })
  }

  /**
   * GET /api/orders/sales-last-7-days
   */
  async getSalesLast7Days({ response }: HttpContext) {
    const sevenDaysAgo = DateTime.now().minus({ days: 7 })

    const salesByDay = await db
      .from('orders')
      .select(
        db.raw("DATE(created_at AT TIME ZONE 'America/Sao_Paulo') as date"),
        db.raw('COUNT(*)::int as total_orders'),
        db.raw("SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END)::int as paid_orders"),
        db.raw(
          "SUM(CASE WHEN payment_status = 'PENDING' THEN 1 ELSE 0 END)::int as pending_orders"
        ),
        db.raw(
          "SUM(CASE WHEN payment_status = 'CANCELLED' THEN 1 ELSE 0 END)::int as cancelled_orders"
        ),
        db.raw(
          "SUM(CASE WHEN payment_status = 'CHARGED_BACK' THEN 1 ELSE 0 END)::int as charged_back_orders"
        ),
        db.raw(
          "SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END)::float as total_sales"
        ),
        db.raw(
          "SUM(CASE WHEN payment_status = 'PAID' THEN discount ELSE 0 END)::float as total_discounts"
        )
      )
      .where('created_at', '>=', sevenDaysAgo.toSQL())
      .groupByRaw("DATE(created_at AT TIME ZONE 'America/Sao_Paulo')")
      .orderByRaw("DATE(created_at AT TIME ZONE 'America/Sao_Paulo') asc")

    const [stats] = await db
      .from('orders')
      .select(
        db.raw('COUNT(*)::int as total_orders'),
        db.raw('SUM(total)::float as total_sales'),
        db.raw('SUM(discount)::float as total_discounts'),
        db.raw('AVG(total)::float as average_order_value')
      )
      .where('created_at', '>=', sevenDaysAgo.toSQL())
      .where('payment_status', 'PAID')

    const fourteenDaysAgo = DateTime.now().minus({ days: 14 })
    const [previousStats] = await db
      .from('orders')
      .select(db.raw('COUNT(*)::int as total_orders'), db.raw('SUM(total)::float as total_sales'))
      .where('created_at', '>=', fourteenDaysAgo.toSQL())
      .where('created_at', '<', sevenDaysAgo.toSQL())
      .where('payment_status', 'PAID')

    const currentOrders = stats.total_orders || 0
    const previousOrders = previousStats.total_orders || 0
    const currentSales = stats.total_sales || 0
    const previousSales = previousStats.total_sales || 0

    const ordersGrowth =
      previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0

    const salesGrowth =
      previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0

    return response.json({
      salesByDay,
      stats: {
        totalOrders: currentOrders,
        totalSales: currentSales,
        totalDiscounts: stats.total_discounts || 0,
        averageOrderValue: stats.average_order_value || 0,
        ordersGrowth: Math.round(ordersGrowth * 100) / 100,
        salesGrowth: Math.round(salesGrowth * 100) / 100,
      },
    })
  }
}
