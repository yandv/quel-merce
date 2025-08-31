import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import { userIdValidator, vehicleIdValidator, includesValidator } from '#validators/user_validator'
import UserNotFoundException from '#exceptions/user_not_found_exception'
import VehicleNotFoundException from '#exceptions/vehicle_not_found_exception'
import VehicleAlreadyAttachedException from '#exceptions/vehicle_already_attached_exception'
import VehicleLimitExceededException from '#exceptions/vehicle_limit_exceeded_exception'
import VehicleNotAttachedException from '#exceptions/vehicle_not_attached_exception'

export default class UsersController {
  /**
   * GET /users/:id
   * Retorna informações do usuário com opção de incluir veículos
   */
  async getUserById({ params, request, response }: HttpContext) {
    const { id } = await userIdValidator.validate(params)
    const { includes } = await includesValidator.validate(request.all())

    const query = User.query().where('id', id)

    if (includes?.includes('vehicles')) {
      query.preload('vehicles', (vehicleQuery) => {
        vehicleQuery.preload('year', (yearQuery) => {
          yearQuery.preload('model', (modelQuery) => {
            modelQuery.preload('brand')
          })
        })
      })
    }

    const user = await query.first()

    if (!user) {
      throw new UserNotFoundException()
    }

    return response.json(user)
  }

  /**
   * GET /users/:id/vehicles
   * Retorna veículos vinculados ao usuário
   */
  async getUserVehicles({ params, request, response }: HttpContext) {
    const { id } = await userIdValidator.validate(params)
    const { includes } = await includesValidator.validate(request.all())

    const user = await User.find(id)

    if (!user) {
      throw new UserNotFoundException()
    }

    const vehiclesQuery = user.related('vehicles').query()

    if (includes?.includes('year')) {
      vehiclesQuery.preload('year')
    }

    if (includes?.includes('model')) {
      vehiclesQuery.preload('year', (yearQuery) => {
        yearQuery.preload('model')
      })
    }

    if (includes?.includes('brand')) {
      vehiclesQuery.preload('year', (yearQuery) => {
        yearQuery.preload('model', (modelQuery) => {
          modelQuery.preload('brand')
        })
      })
    }

    const vehicles = await vehiclesQuery.exec()

    return response.json(vehicles)
  }

  /**
   * POST /users/:id/vehicles/:vehicleId
   * Vincula um veículo ao usuário (limite de 5 veículos)
   */
  async attachVehicle({ params, response }: HttpContext) {
    const { id } = await userIdValidator.validate(params)
    const { vehicleId } = await vehicleIdValidator.validate(params)

    const user = await User.find(id)
    if (!user) {
      throw new UserNotFoundException()
    }

    const vehicle = await Vehicle.find(vehicleId)
    if (!vehicle) {
      throw new VehicleNotFoundException()
    }

    const existingVehicle = await user.related('vehicles').query().where('plate', vehicleId).first()
    if (existingVehicle) {
      throw new VehicleAlreadyAttachedException()
    }

    const vehicleCount = await user.related('vehicles').query().count('* as total')
    const currentCount = Number(vehicleCount[0].$extras.total)

    if (currentCount >= 5) {
      throw new VehicleLimitExceededException()
    }

    await user.related('vehicles').attach([vehicleId])

    return response.status(204)
  }

  /**
   * DELETE /users/:id/vehicles/:vehicleId
   * Desvincula um veículo do usuário
   */
  async detachVehicle({ params, response }: HttpContext) {
    const { id } = await userIdValidator.validate(params)
    const { vehicleId } = await vehicleIdValidator.validate(params)

    const user = await User.find(id)
    if (!user) {
      throw new UserNotFoundException()
    }

    const vehicle = await Vehicle.find(vehicleId)
    if (!vehicle) {
      throw new VehicleNotFoundException()
    }

    const existingVehicle = await user.related('vehicles').query().where('plate', vehicleId).first()
    if (!existingVehicle) {
      throw new VehicleNotAttachedException()
    }

    await user.related('vehicles').detach([vehicleId])

    return response.status(204)
  }
}
