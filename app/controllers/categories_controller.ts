import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import Product from '#models/product'
import db from '@adonisjs/lucid/services/db'
import CategoryNotFoundException from '#exceptions/category/category_not_found_exception'

export default class CategoriesController {
  /**
   * Função auxiliar para obter todos os IDs de subcategorias recursivamente
   */
  private async getAllSubcategoryIds(categoryId: string): Promise<string[]> {
    const result = await db.rawQuery(
      `
      WITH RECURSIVE category_tree AS (
        SELECT id, parent_id, name, 1 as level
        FROM categories
        WHERE id = ?
        
        UNION ALL
        
        SELECT c.id, c.parent_id, c.name, ct.level + 1
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT id FROM category_tree WHERE id != ?
      `,
      [categoryId, categoryId]
    )

    return result.rows.map((row: any) => row.id)
  }

  /**
   * GET /categories
   * Lista as categorias e seus filhos (até um limite de 5 níveis)
   */
  async getCategories({ response }: HttpContext) {
    const categories = await Category.query()
      .whereNull('parentId')
      .preload('children', (query) => {
        query.preload('children', (subQuery) => {
          subQuery.preload('children', (subSubQuery) => {
            subSubQuery.preload('children', (subSubSubQuery) => {
              subSubSubQuery.preload('children')
            })
          })
        })
      })
      .exec()

    return response.json(categories)
  }

  /**
   * GET /categories/:id/products
   * Lista os produtos de uma categoria e suas subcategorias (recursivamente) com busca por nome do year, brand ou model
   */
  async getCategoryProducts({ params, request, response }: HttpContext) {
    const { id } = params
    const { name, yearName, modelName, brandName } = request.all()

    const category = await Category.find(id)

    if (!category) {
      throw new CategoryNotFoundException()
    }

    const subcategoryIds = await this.getAllSubcategoryIds(id)

    // Incluir a categoria principal e todas as subcategorias
    const allCategoryIds = [id, ...subcategoryIds]

    const query = Product.query()
      .whereIn('categoryId', allCategoryIds)
      .preload('category')
      .preload('years', (yearQuery) => {
        yearQuery.preload('model', (modelQuery) => {
          modelQuery.preload('brand')
        })
      })

    if (name) {
      query.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${name}%`])
    }

    if (yearName) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereRaw('LOWER(UNACCENT(CAST(year AS TEXT))) LIKE ?', [`%${yearName}%`])
      })
    }

    if (modelName) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${modelName}%`])
        })
      })
    }

    if (brandName) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereHas('brand', (brandQuery) => {
            brandQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${brandName}%`])
          })
        })
      })
    }

    const products = await query.exec()

    return response.json(products)
  }
}
