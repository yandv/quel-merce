import DomainException from '#exceptions/domain_exception'

export default class InternalServerErrorException extends DomainException {
  static status = 500
  static code = 'E_INTERNAL_SERVER_ERROR'
  static message = 'Erro interno do servidor'
}
