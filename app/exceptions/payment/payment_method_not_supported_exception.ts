import DomainException from '#exceptions/domain_exception'

export default class PaymentMethodNotSupportedException extends DomainException {
  static status = 400
  static code = 'PAYMENT_METHOD_NOT_SUPPORTED'
  static message = 'Método de pagamento não suportado'

  constructor(method?: string) {
    const message = method
      ? `O método de pagamento "${method}" não está habilitado no momento. Somente pagamentos via PIX estão disponíveis.`
      : PaymentMethodNotSupportedException.message
    super(message)
  }
}
