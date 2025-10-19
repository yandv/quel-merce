import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Estatísticas gerais da dashboard admin
   */
  async getDashboardStats({ response }: HttpContext) {
    // Estatísticas de usuários
    const [userStats] = await db
      .from('users')
      .select(
        db.raw('COUNT(*)::int as total_users'),
        db.raw("SUM(CASE WHEN role = 'CUSTOMER' THEN 1 ELSE 0 END)::int as customers"),
        db.raw("SUM(CASE WHEN role = 'SELLER' THEN 1 ELSE 0 END)::int as sellers"),
        db.raw("SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END)::int as admins"),
        db.raw('SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END)::int as new_today')
      )

    // Estatísticas de produtos
    const [productStats] = await db
      .from('products')
      .select(
        db.raw('COUNT(*)::int as total_products'),
        db.raw('SUM(CASE WHEN disabled_at IS NULL THEN 1 ELSE 0 END)::int as active_products'),
        db.raw('SUM(CASE WHEN thumbnail_url IS NOT NULL THEN 1 ELSE 0 END)::int as with_images'),
        db.raw('SUM(CASE WHEN sku IS NOT NULL THEN 1 ELSE 0 END)::int as with_sku')
      )

    // Estatísticas de pedidos
    const [orderStats] = await db
      .from('orders')
      .select(
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
        db.raw('SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END)::int as orders_today')
      )

    // Vendas totais (apenas pedidos pagos)
    const [salesStats] = await db
      .from('orders')
      .select(
        db.raw(
          "SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END)::float as total_sales"
        ),
        db.raw(
          "SUM(CASE WHEN payment_status = 'PAID' THEN discount ELSE 0 END)::float as total_discounts"
        ),
        db.raw(
          "AVG(CASE WHEN payment_status = 'PAID' THEN total ELSE NULL END)::float as average_order_value"
        )
      )

    // Vendas de hoje
    const [todaySales] = await db
      .from('orders')
      .select(
        db.raw(
          "SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END)::float as sales_today"
        ),
        db.raw("COUNT(CASE WHEN payment_status = 'PAID' THEN 1 ELSE NULL END)::int as orders_today")
      )
      .whereRaw('DATE(created_at) = CURRENT_DATE')

    // Comparação com ontem
    const yesterday = DateTime.now().minus({ days: 1 }).toSQLDate()
    const [yesterdaySales] = await db
      .from('orders')
      .select(
        db.raw(
          "SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END)::float as sales_yesterday"
        ),
        db.raw(
          "COUNT(CASE WHEN payment_status = 'PAID' THEN 1 ELSE NULL END)::int as orders_yesterday"
        )
      )
      .whereRaw('DATE(created_at) = ?', [yesterday])

    // Calcular crescimento
    const todaySalesValue = todaySales.sales_today || 0
    const yesterdaySalesValue = yesterdaySales.sales_yesterday || 0
    const todayOrdersValue = todaySales.orders_today || 0
    const yesterdayOrdersValue = yesterdaySales.orders_yesterday || 0

    const salesGrowth =
      yesterdaySalesValue > 0
        ? ((todaySalesValue - yesterdaySalesValue) / yesterdaySalesValue) * 100
        : 0

    const ordersGrowth =
      yesterdayOrdersValue > 0
        ? ((todayOrdersValue - yesterdayOrdersValue) / yesterdayOrdersValue) * 100
        : 0

    return response.json({
      users: {
        total: userStats.total_users || 0,
        customers: userStats.customers || 0,
        sellers: userStats.sellers || 0,
        admins: userStats.admins || 0,
        newToday: userStats.new_today || 0,
      },
      products: {
        total: productStats.total_products || 0,
        active: productStats.active_products || 0,
        withImages: productStats.with_images || 0,
        withSku: productStats.with_sku || 0,
      },
      orders: {
        total: orderStats.total_orders || 0,
        paid: orderStats.paid_orders || 0,
        pending: orderStats.pending_orders || 0,
        cancelled: orderStats.cancelled_orders || 0,
        chargedBack: orderStats.charged_back_orders || 0,
        today: orderStats.orders_today || 0,
      },
      sales: {
        total: salesStats.total_sales || 0,
        totalDiscounts: salesStats.total_discounts || 0,
        averageOrderValue: salesStats.average_order_value || 0,
        today: todaySalesValue,
        todayOrders: todayOrdersValue,
        salesGrowth: Math.round(salesGrowth * 100) / 100,
        ordersGrowth: Math.round(ordersGrowth * 100) / 100,
      },
    })
  }
}
