import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name').notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).nullable()
      table.string('sku').nullable()
      table.string('thumbnail_url').nullable()
      table
        .uuid('category_id')
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE')

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
