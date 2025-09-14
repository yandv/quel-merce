import DomainException from '../domain_exception.js'

export default class VehicleLimitExceededException extends DomainException {
  static status = 400
  static code = 'E_VEHICLE_LIMIT_EXCEEDED'
  static message = 'Limite máximo de 5 veículos por usuário atingido'
}
