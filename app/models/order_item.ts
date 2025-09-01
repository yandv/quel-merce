import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Order from './order.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class OrderItem extends BaseModel {
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
  declare productId: string

  @belongsTo(() => Product, {
    foreignKey: 'productId',
    localKey: 'id',
  })
  declare product: BelongsTo<typeof Product>

  @column()
  declare quantity: number

  @column()
  declare price: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
