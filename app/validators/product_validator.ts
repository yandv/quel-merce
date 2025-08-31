import vine from '@vinejs/vine'

export const productQueryValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
    yearName: vine.string().optional(),
    modelName: vine.string().optional(),
    brandName: vine.string().optional(),
    yearId: vine.string().optional(),
    modelId: vine.string().optional(),
    brandId: vine.string().optional(),
    offset: vine.number().optional(),
    limit: vine.number().optional(),
    includes: vine.string().optional(),
  })
)

export const productIdValidator = vine.compile(
  vine.object({
    id: vine.string(),
  })
)
