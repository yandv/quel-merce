import DomainException from '../domain_exception.js'

export default class CouponMinimumOrderValueNotMetException extends DomainException {
  static status = 400
  static code = 'COUPON_MINIMUM_ORDER_VALUE_NOT_MET'
  static message = 'Valor mínimo do pedido não atingido'

  constructor(minimumOrderValue: number) {
    super(
      `Valor mínimo do pedido não atingido. Mínimo: ${minimumOrderValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
    )
  }
}
