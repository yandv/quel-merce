import DomainException from '#exceptions/domain_exception'

export default class UserEmailVerificationCodeNotFoundOrExpiredException extends DomainException {
  static status = 400
  static code = 'USER_EMAIL_VERIFICATION_CODE_NOT_FOUND'
  static message = 'Código de verificação de email não encontrado'

  constructor(code?: string) {
    const message = code
      ? `O código de verificação de email "${code}" não foi encontrado`
      : UserEmailVerificationCodeNotFoundOrExpiredException.message
    super(message)
  }
}
