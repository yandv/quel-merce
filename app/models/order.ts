import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import OrderItem from './order_item.js'
import Coupon from './coupon.js'

export enum OrderPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  CHARGED_BACK = 'CHARGED_BACK',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @belongsTo(() => User, {
    foreignKey: 'userId',
    localKey: 'id',
  })
  declare user: BelongsTo<typeof User>

  @column()
  declare paymentMethod: PaymentMethod

  @column()
  declare paymentStatus: OrderPaymentStatus

  @column()
  declare couponId: string | null

  @belongsTo(() => Coupon, {
    foreignKey: 'couponId',
    localKey: 'id',
  })
  declare coupon: BelongsTo<typeof Coupon>

  @column()
  declare total: number

  @column()
  declare discount: number

  @column()
  declare paidAt: DateTime | null

  @hasMany(() => OrderItem, {
    foreignKey: 'orderId',
    localKey: 'id',
  })
  declare items: HasMany<typeof OrderItem>

  @column()
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime
}
