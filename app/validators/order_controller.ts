import vine from '@vinejs/vine'
import { PaymentMethod } from '#models/order'

export const createOrderValidator = vine.compile(
  vine.object({
    items: vine.array(
      vine.object({
        productId: vine.string().uuid(),
        quantity: vine.number().positive(),
      })
    ),
    paymentMethod: vine.enum(PaymentMethod),
  })
)

export const orderIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)
