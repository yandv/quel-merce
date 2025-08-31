import DomainException from './domain_exception.js'

export default class VehicleAlreadyAttachedException extends DomainException {
  static status = 400
  static code = 'E_VEHICLE_ALREADY_ATTACHED'
  static message = 'Veículo já está vinculado a este usuário'
}
