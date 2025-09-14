import DomainException from '#exceptions/domain_exception'

export default class OrderNotFoundException extends DomainException {
  static status = 404
  static code = 'ORDER_NOT_FOUND'
  static message = 'Pedido não encontrado'

  constructor(orderId?: string) {
    const message = orderId
      ? `Pedido com ID "${orderId}" não foi encontrado`
      : OrderNotFoundException.message
    super(message)
  }
}
