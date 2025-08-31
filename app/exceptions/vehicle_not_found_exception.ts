import DomainException from './domain_exception.js'

export default class VehicleNotFoundException extends DomainException {
  static status = 404
  static code = 'E_VEHICLE_NOT_FOUND'
  static message = 'Veículo não encontrado'
}
