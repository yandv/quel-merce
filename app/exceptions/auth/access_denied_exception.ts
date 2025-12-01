import DomainException from '#exceptions/domain_exception'

export default class AccessDeniedException extends DomainException {
  static status = 403
  static code = 'E_ACCESS_DENIED'
  static message = 'Acesso negado'
}
