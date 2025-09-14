import VehicleNotFoundException from '#exceptions/vehicle/vehicle_not_found_exception'
import type { HttpContext } from '@adonisjs/core/http'

export default class VehiclesController {
  async getVehicleInfoByPlate(ctx: HttpContext) {
    const plate = ctx.request.param('plate').replace('-', '').toLowerCase()

    const brand = 'Renault'
    const model = 'Sandero'
    const fullName = 'Sandero Expr 1.6'
    const year = '2015'
    const color = 'White'

    if (plate !== 'lrz7447') {
      throw new VehicleNotFoundException()
    }

    return ctx.response.json({
      plate,
      brand,
      model,
      fullName,
      year,
      color,
    })
  }
}
