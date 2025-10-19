import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'
import SlugService from '#services/slug_service'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare parentId: string | null

  @belongsTo(() => Category, {
    foreignKey: 'parentId',
    localKey: 'id',
  })
  declare parent: BelongsTo<typeof Category>

  @hasMany(() => Category, {
    foreignKey: 'parentId',
    localKey: 'id',
  })
  declare children: HasMany<typeof Category>

  @hasMany(() => Product, {
    foreignKey: 'categoryId',
    localKey: 'id',
  })
  declare products: HasMany<typeof Product>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeSave()
  static async generateSlug(category: Category) {
    if (category.$dirty.name && !category.$dirty.slug) {
      category.slug = await SlugService.generateUniqueSlug(category.name, Category, category.id)
    }
  }
}
