import DomainException from '../domain_exception.js'

export default class VehicleNotAttachedException extends DomainException {
  static status = 400
  static code = 'E_VEHICLE_NOT_ATTACHED'
  static message = 'Veículo não está vinculado a este usuário'
}
