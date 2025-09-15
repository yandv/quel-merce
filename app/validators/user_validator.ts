import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(6),
    rememberMe: vine.boolean().optional(),
  })
)

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine
      .string()
      .trim()
      .alpha({
        allowSpaces: true,
      })
      .minLength(2)
      .maxLength(100),
    email: vine.string().email().trim().unique({
      table: 'users',
      column: 'email',
    }),
    password: vine.string().minLength(6).maxLength(50),
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine
      .string()
      .trim()
      .alpha({
        allowSpaces: true,
      })
      .minLength(2)
      .maxLength(100)
      .optional(),
    avatarUrl: vine.string().trim().url().optional(),
  })
)

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

export const codeValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(100),
  })
)

export const emailValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
  })
)
