import DomainException from '../domain_exception.js'

export default class CouponNotFoundException extends DomainException {
  static status = 404
  static code = 'COUPON_NOT_FOUND'
  static message = 'Cupom não encontrado'

  constructor(code?: string) {
    const message = code ? `O cupom "${code}" não foi encontrado` : CouponNotFoundException.message
    super(message)
  }
}
