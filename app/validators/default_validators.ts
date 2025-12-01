import vine from '@vinejs/vine'

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

const transformSort = (value: string) => {
  return value
    .split(',')
    .map((item) => item.trim())
    .map((item) => {
      const order = item.startsWith('-') ? SortOrder.DESC : SortOrder.ASC
      const field = item.startsWith('-') ? item.slice(1) : item

      return {
        field,
        order,
      }
    })
}

export const sortValidator = vine.compile(
  vine.object({
    sort: vine
      .string()
      .regex(/^-?[a-zA-Z_][a-zA-Z0-9_]*(?:,-?[a-zA-Z_][a-zA-Z0-9_]*)*$/)
      .optional(),
  })
)

export const paginationValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    itemsPerPage: vine.number().positive().max(512).optional(),
  })
)

export const parseToArray = (value: string | string[] | undefined) => {
  if (value === undefined) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  return [value]
}

export const includesValidator = vine.compile(
  vine.object({
    includes: vine
      .string()
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*(?:,[a-zA-Z_][a-zA-Z0-9_]*)*$/)
      .optional()
      .transform((value) => value?.split(',')),
  })
)

export const sortAndPaginationValidator = vine.compile(
  vine.object({
    sort: vine
      .string()
      .regex(/^-?[a-zA-Z_][a-zA-Z0-9_]*(?:,-?[a-zA-Z_][a-zA-Z0-9_]*)*$/)
      .optional()
      .transform(transformSort),
    page: vine.number().positive().optional(),
    itemsPerPage: vine.number().positive().max(512).optional(),
  })
)
