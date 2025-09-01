import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')

      table.enum('payment_method', ['PIX', 'CREDIT_CARD', 'DEBIT_CARD']).notNullable()
      table.enum('payment_status', ['PENDING', 'PAID', 'CANCELLED', 'CHARGED_BACK']).notNullable()
      table.timestamp('paid_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
