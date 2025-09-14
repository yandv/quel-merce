import DomainException from '../domain_exception.js'

export default class CouponMinimumOrderValueNotMetException extends DomainException {
  static status = 400
  static code = 'COUPON_MINIMUM_ORDER_VALUE_NOT_MET'
  static message = 'Valor mínimo do pedido não atingido'

  constructor(public minimumOrderValue: number) {
    super(`Valor mínimo do pedido não atingido. Mínimo: R$ ${minimumOrderValue.toFixed(2)}`)
  }
}
