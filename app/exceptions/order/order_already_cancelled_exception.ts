import DomainException from '#exceptions/domain_exception'

export default class OrderAlreadyCancelledException extends DomainException {
  static status = 400
  static code = 'E_ORDER_ALREADY_CANCELLED'
  static message = 'Pedido já foi cancelado'
}
