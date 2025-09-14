import vine from '@vinejs/vine'
import { PaymentMethod } from '#models/order'

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
