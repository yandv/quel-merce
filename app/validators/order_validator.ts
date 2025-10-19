import vine from '@vinejs/vine'
import { PaymentMethod, OrderPaymentStatus } from '#models/order'

export const createOrderValidator = vine.compile(
  vine.object({
    items: vine.array(
      vine.object({
        productId: vine.string().uuid().exists({
          table: 'products',
          column: 'id',
        }),
        quantity: vine.number().positive(),
      })
    ),
    paymentMethod: vine.enum(PaymentMethod),
    couponId: vine
      .string()
      .uuid()
      .exists({
        table: 'coupons',
        column: 'id',
      })
      .optional(),
  })
)

export const orderIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)

export const orderQueryValidator = vine.compile(
  vine.object({
    search: vine.string().trim().optional(),
    paymentStatus: vine.enum(OrderPaymentStatus).optional(),
    paymentMethod: vine.enum(PaymentMethod).optional(),
    dateFrom: vine.string().optional(),
    dateTo: vine.string().optional(),
  })
)

export const cancelOrderValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().minLength(1).maxLength(500).optional(),
  })
)
