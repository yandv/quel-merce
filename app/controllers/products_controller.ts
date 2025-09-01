import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { productQueryValidator, productIdValidator } from '#validators/product_validator'
import Category from '#models/category'

export default class ProductsController {
  /**
   * GET /products
   * Lista todos os produtos com opções de filtro por nome, yearName, modelName, brandName
   * e por IDs (yearId, modelId, brandId)
   */
  async getProducts({ request, response }: HttpContext) {
    const {
      name,
      yearName,
      modelName,
      brandName,
      yearId,
      modelId,
      brandId,
      offset = 0,
      limit = 20,
      includes,
    } = await productQueryValidator.validate(request.all())

    const query = Product.query().offset(offset).limit(limit).orderBy('createdAt', 'desc')

    // Processar includes
    const includeArray = includes ? includes.split(',').map((item) => item.trim()) : []

    if (includeArray.includes('category')) {
      query.preload('category')
    }

    if (includeArray.includes('years')) {
      query.preload('years', (yearQuery) => {
        yearQuery.preload('model', (modelQuery) => {
          modelQuery.preload('brand')
        })
      })
    }

    // Filtro por nome do produto
    if (name) {
      query.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${name.toLowerCase()}%`])
    }

    // Filtro por nome do ano
    if (yearName) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereRaw('LOWER(UNACCENT(CAST(year AS TEXT))) LIKE ?', [
          `%${yearName.toLowerCase()}%`,
        ])
      })
    }

    // Filtro por nome do modelo
    if (modelName) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${modelName.toLowerCase()}%`])
        })
      })
    }

    // Filtro por nome da marca
    if (brandName) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereHas('brand', (brandQuery) => {
            brandQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${brandName.toLowerCase()}%`])
          })
        })
      })
    }

    // Filtro por ID do ano
    if (yearId) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.where('id', yearId)
      })
    }

    // Filtro por ID do modelo
    if (modelId) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.where('id', modelId)
        })
      })
    }

    // Filtro por ID da marca
    if (brandId) {
      query.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereHas('brand', (brandQuery) => {
            brandQuery.where('id', brandId)
          })
        })
      })
    }

    const products = await query.exec()

    // Contar total de registros para paginação
    const countQuery = Product.query()

    // Aplicar os mesmos filtros para a contagem
    if (name) {
      countQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${name.toLowerCase()}%`])
    }

    if (yearName) {
      countQuery.whereHas('years', (yearQuery) => {
        yearQuery.whereRaw('LOWER(UNACCENT(CAST(year AS TEXT))) LIKE ?', [
          `%${yearName.toLowerCase()}%`,
        ])
      })
    }

    if (modelName) {
      countQuery.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${modelName.toLowerCase()}%`])
        })
      })
    }

    if (brandName) {
      countQuery.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereHas('brand', (brandQuery) => {
            brandQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${brandName.toLowerCase()}%`])
          })
        })
      })
    }

    if (yearId) {
      countQuery.whereHas('years', (yearQuery) => {
        yearQuery.where('id', yearId)
      })
    }

    if (modelId) {
      countQuery.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.where('id', modelId)
        })
      })
    }

    if (brandId) {
      countQuery.whereHas('years', (yearQuery) => {
        yearQuery.whereHas('model', (modelQuery) => {
          modelQuery.whereHas('brand', (brandQuery) => {
            brandQuery.where('id', brandId)
          })
        })
      })
    }

    const total = await countQuery.count('* as total').first()

    return response.json({
      data: products,
      cursor: {
        offset,
        limit,
        total: Number(total?.$extras.total) || 0,
      },
    })
  }

  /**
   * GET /products/:id
   * Obtém um produto específico por ID
   */
  async getProductById({ params, response }: HttpContext) {
    const { id } = await productIdValidator.validate(params)

    const query = Product.query().where('id', id)

    query.preload('category')

    query.preload('years', (yearQuery) => {
      yearQuery.preload('model', (modelQuery) => {
        modelQuery.preload('brand')
      })
    })

    const product = await query.first()

    if (!product) {
      return response.status(404).json({ error: 'Produto não encontrado' })
    }

    async function loadParents(category: Category | null) {
      if (!category) return
      await category.load('parent')
      if (category.parent) {
        await loadParents(category.parent)
      }
    }

    await loadParents(product.category)

    return response.json(product)
  }
}
