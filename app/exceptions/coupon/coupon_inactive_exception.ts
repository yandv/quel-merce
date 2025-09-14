import DomainException from '../domain_exception.js'

export default class CouponInactiveException extends DomainException {
  static status = 400
  static code = 'COUPON_INACTIVE'
  static message = 'Cupom inativo'

  constructor(code?: string) {
    const message = code ? `O cupom "${code}" está inativo` : CouponInactiveException.message
    super(message)
  }
}
