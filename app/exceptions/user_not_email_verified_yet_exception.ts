import DomainException from './domain_exception.js'

export default class UserNotEmailVerifiedYetException extends DomainException {
  static status = 400
  static code = 'USER_NOT_EMAIL_VERIFIED_YET'
  static message = 'Email não verificado'

  constructor(email?: string) {
    const message = email
      ? `O email "${email}" não foi verificado`
      : UserNotEmailVerifiedYetException.message
    super(message)
  }
}
