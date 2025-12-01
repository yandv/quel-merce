import vine from '@vinejs/vine'

export const yearSearchValidator = vine.compile(
  vine.object({
    search: vine.string().trim().minLength(2).maxLength(100).optional(),
  })
)
