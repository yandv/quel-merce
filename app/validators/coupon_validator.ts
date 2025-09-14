import vine from '@vinejs/vine'

export const couponValidator = vine.compile(
  vine.object({
    code: vine.string(),
    orderTotal: vine.number(),
  })
)
