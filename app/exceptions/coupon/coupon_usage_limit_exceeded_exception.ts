import DomainException from '../domain_exception.js'

export default class CouponUsageLimitExceededException extends DomainException {
  static status = 400
  static code = 'COUPON_USAGE_LIMIT_EXCEEDED'
  static message = 'Limite de uso do cupom foi atingido'

  constructor(code?: string) {
    const message = code
      ? `O cupom "${code}" atingiu seu limite de uso`
      : CouponUsageLimitExceededException.message
    super(message)
  }
}
