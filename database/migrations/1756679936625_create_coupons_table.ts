import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coupons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.string('code').notNullable().unique()
      table.string('description').notNullable()
      table.enum('discount_type', ['PERCENTAGE', 'FIXED_AMOUNT']).notNullable()
      table.decimal('discount_value', 10, 2).notNullable()
      table.decimal('minimum_order_value', 10, 2).notNullable().defaultTo(0)
      table.decimal('maximum_discount', 10, 2).nullable()
      table.integer('usage_limit').nullable()
      table.integer('usage_count').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('valid_from').notNullable()
      table.timestamp('valid_until').notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
