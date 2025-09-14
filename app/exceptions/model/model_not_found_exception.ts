import DomainException from '#exceptions/domain_exception'

export default class ModelNotFoundException extends DomainException {
  static status = 404
  static code = 'E_MODEL_NOT_FOUND'
  static message = 'Modelo não encontrado'
}
