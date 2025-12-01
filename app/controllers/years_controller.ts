import type { HttpContext } from '@adonisjs/core/http'
import Year from '#models/year'
import { sortAndPaginationValidator, includesValidator } from '#validators/default_validators'
import { yearSearchValidator } from '#validators/year_validator'

export default class YearsController {
  /**
   * GET /api/years
   * Lista anos com modelos e marcas para admin com paginação
   */
  async getYears({ request, response }: HttpContext) {
    const data = request.all()

    const { sort, page = 1, itemsPerPage = 10 } = await sortAndPaginationValidator.validate(data)
    const { includes = [] } = await includesValidator.validate(data)
    const { search } = await yearSearchValidator.validate(data)

    const query = Year.query()

    if (search) {
      query
        .whereHas('model', (modelQuery) => {
          modelQuery
            .whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereHas('brand', (brandQuery) => {
              brandQuery.whereRaw('LOWER(UNACCENT(name)) LIKE ?', [`%${search.toLowerCase()}%`])
            })
        })
        .orWhereRaw('LOWER(UNACCENT(CAST(year AS TEXT))) LIKE ?', [`%${search.toLowerCase()}%`])
    }

    if (includes.includes('model')) {
      query.preload('model')
    }

    if (includes.includes('brand')) {
      query.preload('model', (modelQuery) => {
        modelQuery.preload('brand')
      })
    }

    if (sort) {
      query.orderBy(sort.map((item) => ({ column: item.field, order: item.order })))
    } else {
      query.orderBy('year', 'desc')
    }

    const years = await query.paginate(page, itemsPerPage)

    return response.json(years)
  }
}
