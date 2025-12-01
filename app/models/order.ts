import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import OrderItem from './order_item.js'
import Coupon from './coupon.js'
import Payment from './payment.js'

export enum OrderPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  CHARGED_BACK = 'CHARGED_BACK',
}

export enum PaymentMethod {
  PIX = 'PIX',
  MERCADO_PAGO = 'MERCADO_PAGO',
  STRIPE = 'STRIPE',
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

  @hasOne(() => Payment, {
    foreignKey: 'orderId',
    localKey: 'id',
  })
  declare payment: HasOne<typeof Payment>

  @column()
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime
}
