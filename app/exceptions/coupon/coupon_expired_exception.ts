import DomainException from '../domain_exception.js'

export default class CouponExpiredException extends DomainException {
  static status = 400
  static code = 'COUPON_EXPIRED'
  static message = 'Cupom expirado ou inválido'

  constructor(code?: string) {
    const message = code
      ? `O cupom "${code}" expirou ou não é mais válido`
      : CouponExpiredException.message
    super(message)
  }
}
