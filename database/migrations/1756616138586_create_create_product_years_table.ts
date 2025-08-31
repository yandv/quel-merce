import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_years'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.uuid('year_id').notNullable().references('id').inTable('years').onDelete('CASCADE')

      table.primary(['product_id', 'year_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
