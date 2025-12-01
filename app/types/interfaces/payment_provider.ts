import Order from '#models/order'

export interface PaymentResult {
  id: string
  status: string
  qrCode?: string
  qrCodeBase64?: string
  externalReference: string
  provider: string
  checkoutUrl?: string
  preferenceId?: string
  initPoint?: string
  sandboxInitPoint?: string
}

export interface PaymentProvider {
  /**
   * Cria um pagamento para um pedido
   */
  createPayment(order: Order): Promise<PaymentResult>

  /**
   * Busca informações de um pagamento
   */
  getPayment(paymentId: string): Promise<any>

  /**
   * Cancela um pagamento
   */
  cancelPayment(paymentId: string): Promise<any>

  /**
   * Processa notificação de webhook
   */
  processWebhook(data: any): Promise<{ orderId: string; status: string } | null>
}
