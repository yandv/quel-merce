import vine from '@vinejs/vine'

export const yearSearchValidator = vine.compile(
  vine.object({
    search: vine.string().trim().minLength(2).maxLength(100).optional(),
    // excludedYears: vine.union([
    //   vine.union.if((value) => vine.helpers.isString(value), vine.string().uuid()),
    //   vine.union.if((value) => Array.isArray(value), vine.array(vine.string().uuid())),
    //   vine.union.else(vine.literal([] as string[])),
    // ]),
  })
)
