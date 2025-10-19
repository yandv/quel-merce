import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import {
  productQueryValidator,
  productSlugValidator,
  createProductValidator,
  updateProductValidator,
  productIdValidator,
} from '#validators/product_validator'
import Category from '#models/category'
import ProductNotFoundException from '#exceptions/product/product_not_found_exception'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { sortAndPaginationValidator } from '#validators/default_validators'

export default class ProductsController {
  /**
   * GET /products
   * Lista todos os produtos com opções de filtro por nome, yearName, modelName, brandName
   * e por IDs (yearId, modelId, brandId)
   */
  async getProducts({ request, response }: HttpContext) {
    const { name, yearName, modelName, brandName, yearId, modelId, brandId, includes } =
      await productQueryValidator.validate(request.all())
    const {
      sort,
      page = 1,
      itemsPerPage = 10,
    } = await sortAndPaginationValidator.validate(request.all())

    const query = Product.query()

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

    if (sort) {
      query.orderBy(sort.map((item) => ({ column: item.field, order: item.order })))
    }

    const products = await query.paginate(page, itemsPerPage)

    return response.json(products)
  }

  /**
   * GET /products/:slug
   * Obtém um produto específico por slug
   */
  async getProductBySlug({ params, response }: HttpContext) {
    const { slug } = await productSlugValidator.validate(params)

    const query = Product.query().where('slug', slug)

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

  /**
   * GET /api/products/summary
   * Estatísticas dos produtos
   */
  async getProductSummary({ response }: HttpContext) {
    const [stats] = await db
      .from('products as p')
      .select(
        db.raw('COUNT(*)::int as total'),
        db.raw(`SUM(CASE WHEN p.disabled_at IS NULL THEN 1 ELSE 0 END)::int as active`),
        db.raw(`SUM(CASE WHEN p.thumbnail_url IS NOT NULL THEN 1 ELSE 0 END)::int as with_images`),
        db.raw(`SUM(CASE WHEN p.sku IS NOT NULL THEN 1 ELSE 0 END)::int as with_sku`)
      )

    return response.json({
      total: stats.total || 0,
      active: stats.active || 0,
      withImages: stats.with_images || 0,
      withSku: stats.with_sku || 0,
    })
  }

  /**
   * POST /api/products (Admin)
   * Cria um novo produto
   */
  async createProduct({ request, response }: HttpContext) {
    const data = await request.validateUsing(createProductValidator)

    const product = await db.transaction(async (trx) => {
      const newProduct = await Product.create(
        {
          name: data.name,
          description: data.description,
          price: data.price,
          sku: data.sku,
          thumbnailUrl: data.thumbnailUrl,
          categoryId: data.categoryId,
          disabledAt: data.isActive === false ? DateTime.now() : null,
        },
        { client: trx }
      )

      // Associar anos se fornecidos
      if (data.yearIds && data.yearIds.length > 0) {
        await newProduct.related('years').attach(data.yearIds)
      }

      return newProduct
    })

    // Carregar relacionamentos
    await product.load('category')
    await product.load('years', (yearQuery) => {
      yearQuery.preload('model', (modelQuery) => {
        modelQuery.preload('brand')
      })
    })

    return response.status(201).json(product)
  }

  /**
   * PATCH /api/products/:id (Admin)
   * Atualiza um produto existente
   */
  async updateProduct({ params, request, response }: HttpContext) {
    const { id } = await productIdValidator.validate(params)
    const data = await request.validateUsing(updateProductValidator)

    const product = await Product.find(id)
    if (!product) {
      throw new ProductNotFoundException()
    }

    await db.transaction(async () => {
      // Atualizar dados do produto
      product.merge({
        name: data.name,
        description: data.description,
        price: data.price,
        sku: data.sku,
        thumbnailUrl: data.thumbnailUrl,
        categoryId: data.categoryId,
        disabledAt: data.isActive === false ? DateTime.now() : null,
      })

      await product.save()

      // Atualizar anos se fornecidos
      if (data.yearIds !== undefined) {
        await product.related('years').sync(data.yearIds)
      }
    })

    // Carregar relacionamentos atualizados
    await product.load('category')
    await product.load('years', (yearQuery) => {
      yearQuery.preload('model', (modelQuery) => {
        modelQuery.preload('brand')
      })
    })

    return response.json(product)
  }

  /**
   * DELETE /api/products/:id (Admin)
   * Remove um produto
   */
  async deleteProduct({ params, response }: HttpContext) {
    const { id } = await productIdValidator.validate(params)

    const product = await Product.find(id)
    if (!product) {
      throw new ProductNotFoundException()
    }

    await product.delete()

    return response.status(204)
  }
}
