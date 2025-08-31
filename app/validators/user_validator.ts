import vine from '@vinejs/vine'

export const userIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)

export const vehicleIdValidator = vine.compile(
  vine.object({
    vehicleId: vine.string().trim().minLength(1),
  })
)

export const includesValidator = vine.compile(
  vine.object({
    includes: vine.string().optional(),
  })
)
