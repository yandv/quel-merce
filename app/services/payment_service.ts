import { PaymentProvider, PaymentResult } from '../types/interfaces/payment_provider.js'
import { MercadoPagoService } from './mercado_pago_service.js'
import { StripeService } from './stripe_service.js'
import { PaymentProviderType } from '../types/enums/payment_providers.enum.js'
import Order, { PaymentMethod } from '#models/order'

export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map()

  constructor() {
    this.providers.set(PaymentProviderType.MERCADO_PAGO, new MercadoPagoService())
    this.providers.set(PaymentProviderType.STRIPE, new StripeService())
  }

  /**
   * Cria um pagamento para um pedido
   */
  async createPayment(order: Order): Promise<PaymentResult> {
    let provider: PaymentProvider

    // Escolher provedor baseado no método de pagamento
    if (order.paymentMethod === PaymentMethod.STRIPE) {
      provider = this.providers.get(PaymentProviderType.STRIPE)!
    } else {
      provider = this.providers.get(PaymentProviderType.MERCADO_PAGO)!
    }

    if (!provider) {
      throw new Error(`Provedor de pagamento não encontrado`)
    }

    return await provider.createPayment(order)
  }

  /**
   * Busca informações de um pagamento
   */
  async getPayment(paymentId: string, providerType?: string): Promise<any> {
    const provider = providerType
      ? this.providers.get(providerType)
      : this.providers.get(PaymentProviderType.MERCADO_PAGO)

    if (!provider) {
      throw new Error(
        `Provedor de pagamento ${providerType || PaymentProviderType.MERCADO_PAGO} não encontrado`
      )
    }

    return await provider.getPayment(paymentId)
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(paymentId: string, providerType?: string): Promise<any> {
    const provider = providerType
      ? this.providers.get(providerType)
      : this.providers.get(PaymentProviderType.MERCADO_PAGO)

    if (!provider) {
      throw new Error(
        `Provedor de pagamento ${providerType || PaymentProviderType.MERCADO_PAGO} não encontrado`
      )
    }

    return await provider.cancelPayment(paymentId)
  }

  /**
   * Processa webhook de um provedor específico
   */
  async processWebhook(
    providerType: string,
    data: any
  ): Promise<{ orderId: string; status: string } | null> {
    const provider = this.providers.get(providerType)

    if (!provider) {
      throw new Error(`Provedor de pagamento ${providerType} não encontrado`)
    }

    return await provider.processWebhook(data)
  }
}
