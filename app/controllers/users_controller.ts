import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import {
  userIdValidator,
  vehicleIdValidator,
  includesValidator,
  registerValidator,
  loginValidator,
  updateProfileValidator,
  codeValidator,
  emailValidator,
} from '#validators/user_validator'
import UserNotFoundException from '#exceptions/user_not_found_exception'
import VehicleNotFoundException from '#exceptions/vehicle_not_found_exception'
import VehicleAlreadyAttachedException from '#exceptions/vehicle_already_attached_exception'
import VehicleLimitExceededException from '#exceptions/vehicle_limit_exceeded_exception'
import VehicleNotAttachedException from '#exceptions/vehicle_not_attached_exception'
import { DateTime } from 'luxon'
import UserEmailVerificationCode from '#models/user_email_verification_code'
import UserEmailVerificationCodeNotFoundOrExpiredException from '#exceptions/user_email_verification_code_not_found_or_expired_exception'
import UserNotEmailVerifiedYetException from '#exceptions/user_not_email_verified_yet_exception'

export default class UsersController {
  async login({ request, response, auth }: HttpContext) {
    const { email, password } = await loginValidator.validate(request.all())

    const user = await User.verifyCredentials(email, password)

    if (!user.emailVerifiedAt) {
      throw new UserNotEmailVerifiedYetException()
    }

    await auth.use('web').login(user)

    return response.status(200).json({
      message: 'User logged in successfully',
    })
  }

  async logout({ auth }: HttpContext) {
    await auth.use('web').logout()
  }

  async register({ request, response }: HttpContext) {
    const { fullName, email, password } = await registerValidator.validate(request.all())

    const user = await User.create({ fullName, email, password })

    const code = Math.random().toString(36).substring(2, 15)
    await UserEmailVerificationCode.create({
      userId: user.id,
      code,
      expiresAt: DateTime.now().plus({ minutes: 10 }),
    })

    // TODO: Implementar envio de email com o código
    // Por enquanto, apenas retornamos sucesso com redirecionamento
    return response.status(201).json(user)
  }

  async verifyEmail({ response, params, auth }: HttpContext) {
    const { code } = await codeValidator.validate(params)

    const userEmailVerificationCode = await UserEmailVerificationCode.query()
      .where('code', code)
      .preload('user')
      .first()

    if (!userEmailVerificationCode) {
      throw new UserEmailVerificationCodeNotFoundOrExpiredException()
    }

    if (userEmailVerificationCode.expiresAt < DateTime.now()) {
      throw new UserEmailVerificationCodeNotFoundOrExpiredException()
    }

    userEmailVerificationCode.user.emailVerifiedAt = DateTime.now()
    await userEmailVerificationCode.user.save()
    await UserEmailVerificationCode.query()
      .where('user_id', userEmailVerificationCode.user.id)
      .delete()

    await auth.use('web').login(userEmailVerificationCode.user)

    return response.status(200).json({
      message: 'Email verified successfully',
    })
  }

  private getCountdown(codeCount: number) {
    const baseDelay = 30
    const maxDelay = 900
    return Math.min(maxDelay, baseDelay * Math.pow(2, codeCount))
  }

  async resendVerificationEmail({ params, response }: HttpContext) {
    const { email } = await emailValidator.validate(params)

    const user = await User.findBy('email', email)
    if (!user) {
      throw new UserNotFoundException()
    }

    // Gerar novo código
    const code = Math.random().toString(36).substring(2, 15)
    await UserEmailVerificationCode.create({
      userId: user.id,
      code,
      expiresAt: DateTime.now().plus({ minutes: 10 }),
    })

    // TODO: Implementar envio de email com o código
    // Por enquanto, apenas retornamos sucesso

    // Calcular novos valores de countdown após criar o código
    const allCodes = await UserEmailVerificationCode.query()
      .where('user_id', user.id)
      .where('created_at', '>', DateTime.now().minus({ hours: 12 }).toISO())
      .exec()

    const codeCount = allCodes.length
    const lastResendCountdown = this.getCountdown(codeCount - 1)

    // O novo código acaba de ser criado, então o countdown é o tempo de espera
    const resendCountdown = lastResendCountdown

    return response.status(200).json({
      message: 'New verification code generated and sent',
      resendCountdown,
      lastResendCountdown,
    })
  }

  async getVerificationCodeStatus({ params, response }: HttpContext) {
    const { email } = await emailValidator.validate(params)

    const user = await User.findBy('email', email)

    if (!user) {
      throw new UserNotFoundException()
    }

    // Verificar códigos de verificação das últimas 12 horas
    const existingCodes = await UserEmailVerificationCode.query()
      .where('user_id', user.id)
      .where('created_at', '>', DateTime.now().minus({ hours: 12 }).toISO())
      .exec()

    if (!existingCodes.length) {
      return response.status(200).json({
        resendCountdown: 0,
        lastResendCountdown: 0,
      })
    }

    // Ordenar por data de criação (mais recente primeiro)
    const sortedCodes = existingCodes.sort((a, b) => b.createdAt.diff(a.createdAt).as('seconds'))

    const lastVerificationCode = sortedCodes[0]
    const codeCount = existingCodes.length

    // Calcular tempo até próximo resend permitido
    const nextResendTime = lastVerificationCode.createdAt.plus({
      seconds: this.getCountdown(codeCount - 1),
    })

    const resendCountdown = Math.max(
      0,
      Math.ceil(nextResendTime.diff(DateTime.now()).as('seconds'))
    )

    // Calcular último tempo de espera usado
    const lastResendCountdown = this.getCountdown(codeCount - 1)

    return response.status(200).json({
      resendCountdown,
      lastResendCountdown,
    })
  }

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

  async getUserOrders({ params, request, response }: HttpContext) {
    const { id } = await userIdValidator.validate(params)
    const { includes } = await includesValidator.validate(request.all())

    const user = await User.find(id)

    if (!user) {
      throw new UserNotFoundException()
    }

    const ordersQuery = user.related('orders').query()

    if (includes?.includes('items')) {
      ordersQuery.preload('items', (itemQuery) => {
        itemQuery.preload('product')
      })
    }

    const orders = await ordersQuery.orderBy('created_at', 'desc').exec()

    return response.json(orders)
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

  /**
   * PATCH /users/:id
   * Atualiza o perfil do usuário (nome e foto) e permite que um usuário atualize seu próprio perfil
   */
  async updateProfile({ params, request, response, auth }: HttpContext) {
    const { id } = await userIdValidator.validate(params)
    const data = await updateProfileValidator.validate(request.all())

    const authenticatedUser = auth.user

    if (!authenticatedUser || authenticatedUser.id !== id) {
      return response.status(403).json({
        message: 'Unauthorized to update this profile',
      })
    }

    const user = await User.find(id)

    if (!user) {
      throw new UserNotFoundException()
    }

    if (data.fullName !== undefined) {
      user.fullName = data.fullName
    }
    if (data.avatarUrl !== undefined) {
      user.avatarUrl = data.avatarUrl
    }

    await user.save()

    return response.json(user)
  }
}
