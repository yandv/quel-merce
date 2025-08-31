import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import Year from '#models/year'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare price: number | null

  @column()
  declare sku: string | null

  @column()
  declare thumbnailUrl: string | null

  @column()
  declare categoryId: string

  @belongsTo(() => Category, {
    foreignKey: 'categoryId',
    localKey: 'id',
  })
  declare category: BelongsTo<typeof Category>

  @manyToMany(() => Year, {
    pivotTable: 'product_years',
    pivotForeignKey: 'product_id',
    pivotRelatedForeignKey: 'year_id',
  })
  declare years: ManyToMany<typeof Year>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
