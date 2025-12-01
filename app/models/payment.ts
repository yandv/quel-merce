import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import { PaymentProviderType } from '../types/enums/payment_providers.enum.js'

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
}

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
    localKey: 'id',
  })
  declare order: BelongsTo<typeof Order>

  @column()
  declare provider: PaymentProviderType

  @column()
  declare providerId: string

  @column()
  declare status: PaymentStatus

  @column()
  declare amount: number

  @column()
  declare qrCode: string | null

  @column()
  declare qrCodeBase64: string | null

  @column()
  declare providerStatus: string | null

  @column()
  declare metadata: Record<string, any> | null

  @column()
  declare paidAt: DateTime | null

  @column()
  declare checkoutUrl: string | null

  @column()
  declare preferenceId: string | null

  @column()
  declare initPoint: string | null

  @column()
  declare sandboxInitPoint: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
