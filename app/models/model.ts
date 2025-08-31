import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Brand from '#models/brand'
import Vehicle from '#models/vehicle'

export default class Model extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare brandId: string

  @belongsTo(() => Brand, {
    foreignKey: 'brandId',
    localKey: 'id',
  })
  declare brand: BelongsTo<typeof Brand>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @hasMany(() => Vehicle, {
    foreignKey: 'modelId',
    localKey: 'id',
  })
  declare cars: HasMany<typeof Vehicle>
}
