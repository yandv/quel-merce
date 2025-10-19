import vine from '@vinejs/vine'

export const categorySlugValidator = vine.compile(
  vine.object({
    slug: vine.string().trim().minLength(1),
  })
)
