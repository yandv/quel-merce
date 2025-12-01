import DomainException from '#exceptions/domain_exception'

export default class OrderCannotBeModifiedException extends DomainException {
  static status = 400
  static code = 'E_ORDER_CANNOT_BE_MODIFIED'
  static message = 'Não é possível alterar método de pagamento de um pedido já processado'
}
