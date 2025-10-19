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
    includes: vine.string().optional(),
  })
)

export const productIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)

export const productSlugValidator = vine.compile(
  vine.object({
    slug: vine.string().trim().minLength(1),
  })
)

export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().optional(),
    price: vine.number().positive(),
    sku: vine.string().trim().optional(),
    thumbnailUrl: vine.string().trim().url().optional(),
    categoryId: vine.string().uuid(),
    isActive: vine.boolean().optional(),
    yearIds: vine.array(vine.string().uuid()).optional(),
  })
)

export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().optional(),
    price: vine.number().positive().optional(),
    sku: vine.string().trim().optional(),
    thumbnailUrl: vine.string().trim().url().optional(),
    categoryId: vine.string().uuid().optional(),
    isActive: vine.boolean().optional(),
    yearIds: vine.array(vine.string().uuid()).optional(),
  })
)
