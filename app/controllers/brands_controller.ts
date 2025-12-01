import type { HttpContext } from '@adonisjs/core/http'
import Brand from '#models/brand'
import Year from '#models/year'
import {
  brandIdValidator,
  brandQueryValidator,
  modelQueryValidator,
  getYearsValidator,
} from '#validators/brand_validator'
import BrandNotFoundException from '#exceptions/brand/brand_not_found_exception'
import ModelNotFoundException from '#exceptions/model/model_not_found_exception'

export default class BrandsController {
  /**
   * GET /brands
   * Lista todas as marcas com opção de busca por nome
   */
  async getBrands({ request, response }: HttpContext) {
    const { name } = await brandQueryValidator.validate(request.all())

    const query = Brand.query().orderBy('name', 'asc')

    if (name) {
      query.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${name.toLowerCase()}%`])
    }

    const brands = await query.exec()

    return response.json(brands)
  }

  /**
   * GET /brands/:id/models
   * Lista todos os modelos de uma marca com opção de busca por nome
   */
  async getModels({ params, request, response }: HttpContext) {
    const { id } = await brandIdValidator.validate(params)
    const { name } = await modelQueryValidator.validate(request.all())

    const brand = await Brand.find(id)

    if (!brand) {
      throw new BrandNotFoundException()
    }

    const query = brand.related('models').query().orderBy('name', 'asc')

    if (name) {
      query.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${name.toLowerCase()}%`])
    }

    const models = await query.exec()

    return response.json(models)
  }

  /**
   * GET /brands/:id/models/:modelId/years
   * Lista todos os anos de um modelo específico com opção de busca por nome
   */
  async getYears({ params, request, response }: HttpContext) {
    const {
      id: brandId,
      modelId,
      name,
    } = await getYearsValidator.validate({
      ...params,
      ...request.all(),
    })

    const brand = await Brand.find(brandId)
    if (!brand) {
      throw new BrandNotFoundException()
    }

    const model = await brand.related('models').query().where('id', modelId).first()

    if (!model) {
      throw new ModelNotFoundException()
    }

    const query = Year.query().where('modelId', modelId).orderBy('year', 'desc')

    if (name) {
      query.whereRaw('LOWER(UNACCENT(CAST(year AS TEXT))) LIKE ?', [`%${name.toLowerCase()}%`])
    }

    const years = await query.exec()

    return response.json(years)
  }
}
