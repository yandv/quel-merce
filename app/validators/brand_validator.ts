import vine from '@vinejs/vine'

export const brandIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)

export const modelIdValidator = vine.compile(
  vine.object({
    modelId: vine.string().uuid(),
  })
)

export const yearIdValidator = vine.compile(
  vine.object({
    yearId: vine.string().uuid(),
  })
)

export const brandQueryValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
  })
)

export const modelQueryValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
  })
)

export const yearQueryValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
  })
)

export const getYearsValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
    modelId: vine.string().uuid(),
    name: vine.string().optional(),
  })
)
