import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Vehicle from '#models/vehicle'
import Order from './order.js'
import UserEmailVerificationCode from './user_email_verification_code.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
}

export const RoleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.SELLER]: 2,
  [UserRole.CUSTOMER]: 1,
}

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare avatarUrl: string | null

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare emailVerifiedAt: DateTime | null

  @column()
  declare role: UserRole

  @manyToMany(() => Vehicle, {
    pivotTable: 'user_vehicles',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'vehicle_plate',
    localKey: 'id',
    relatedKey: 'plate',
  })
  declare vehicles: ManyToMany<typeof Vehicle>

  @hasMany(() => Order, {
    foreignKey: 'userId',
    localKey: 'id',
  })
  declare orders: HasMany<typeof Order>

  @hasMany(() => UserEmailVerificationCode, {
    foreignKey: 'userId',
    localKey: 'id',
  })
  declare verificationCodes: HasMany<typeof UserEmailVerificationCode>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
