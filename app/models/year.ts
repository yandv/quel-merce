import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Vehicle from '#models/vehicle'
import Model from '#models/model'

export default class Year extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare year: number

  @column()
  declare modelId: string

  @belongsTo(() => Model, {
    foreignKey: 'modelId',
    localKey: 'id',
  })
  declare model: BelongsTo<typeof Model>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @hasMany(() => Vehicle, {
    foreignKey: 'yearId',
    localKey: 'id',
  })
  declare vehicles: HasMany<typeof Vehicle>
}
