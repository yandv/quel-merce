import DomainException from '#exceptions/domain_exception'

export default class UserEmailAlreadyVerifiedException extends DomainException {
  static status = 400
  static code = 'USER_EMAIL_ALREADY_VERIFIED'
  static message = 'Email já verificado'
}
