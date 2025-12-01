import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.string('provider').notNullable()
      table.string('provider_id').notNullable()
      table.string('status').notNullable()
      table.decimal('amount', 10, 2).notNullable()
      table.text('qr_code').nullable()
      table.text('qr_code_base_64').nullable()
      table.string('provider_status').nullable()
      table.json('metadata').nullable()
      table.timestamp('paid_at').nullable()
      table.string('checkout_url', 500).nullable()

      table.string('preference_id', 500).nullable()
      table.string('init_point', 500).nullable()
      table.string('sandbox_init_point', 500).nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
