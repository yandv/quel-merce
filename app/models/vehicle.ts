import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Year from '#models/year'

export default class Vehicle extends BaseModel {
  @column({ isPrimary: true })
  declare plate: string

  @column()
  declare yearId: string

  @belongsTo(() => Year, {
    foreignKey: 'yearId',
    localKey: 'id',
  })
  declare year: BelongsTo<typeof Year>

  @manyToMany(() => User, {
    pivotTable: 'user_vehicles',
    pivotForeignKey: 'vehicle_plate',
    pivotRelatedForeignKey: 'user_id',
    localKey: 'plate',
    relatedKey: 'id',
  })
  declare users: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
