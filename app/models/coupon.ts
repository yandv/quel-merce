import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Order from './order.js'

export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export default class Coupon extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column()
  declare description: string

  @column()
  declare discountType: CouponDiscountType

  @column()
  declare discountValue: number

  @column()
  declare minimumOrderValue: number

  @column()
  declare maximumDiscount: number | null

  @column()
  declare usageLimit: number | null

  @column()
  declare usageCount: number

  @column()
  declare isActive: boolean

  @column()
  declare validFrom: DateTime

  @column()
  declare validUntil: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>
}
