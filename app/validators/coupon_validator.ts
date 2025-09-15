import { CouponDiscountType } from '#models/coupon'
import vine from '@vinejs/vine'

export const couponValidator = vine.compile(
  vine.object({
    code: vine.string(),
  })
)

export const createCouponValidator = vine.compile(
  vine.object({
    code: vine.string().alphaNumeric().unique({
      table: 'coupons',
      column: 'code',
    }),
    description: vine.string(),
    discountType: vine.enum(CouponDiscountType),
    discountValue: vine.number(),
    minimumOrderValue: vine.number(),
    maximumDiscount: vine.number().optional(),
    usageLimit: vine.number().optional(),
    validFrom: vine.date(),
    validUntil: vine.date(),
    isActive: vine.boolean(),
  })
)

export const updateCouponValidator = vine.compile(
  vine.object({
    description: vine.string().optional(),
    discountType: vine.enum(CouponDiscountType).optional(),
    discountValue: vine.number().optional(),
    minimumOrderValue: vine.number().optional(),
    maximumDiscount: vine.number().optional(),
    usageLimit: vine.number().optional(),
    validFrom: vine
      .date({
        formats: {
          format: 'iso',
        },
      })
      .optional(),
    validUntil: vine
      .date({
        formats: {
          format: 'iso',
        },
      })
      .optional(),
    isActive: vine.boolean().optional(),
  })
)

export const deleteCouponValidator = vine.compile(
  vine.object({
    id: vine.string().uuid().exists({
      table: 'coupons',
      column: 'id',
    }),
  })
)

export const couponQueryValidator = vine.compile(
  vine.object({
    name: vine.string().alphaNumeric({ allowSpaces: true }).optional(),
    active: vine.boolean().optional(),
    limit: vine.number().optional(),
    offset: vine.number().optional(),
  })
)

export const couponIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid().exists({
      table: 'coupons',
      column: 'id',
    }),
  })
)
