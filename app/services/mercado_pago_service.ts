import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import env from '#start/env'
import Order from '#models/order'
import { PaymentProvider, PaymentResult } from '../types/interfaces/payment_provider.js'
import { PaymentProviderType } from '../types/enums/payment_providers.enum.js'
import { PaymentCreateData } from 'mercadopago/dist/clients/payment/create/types.js'
import { PreferenceCreateData } from 'mercadopago/dist/clients/preference/create/types.js'

export class MercadoPagoService implements PaymentProvider {
  private client: MercadoPagoConfig
  private payment: Payment
  private preference: Preference

  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: env.get('MERCADOPAGO_ACCESS_TOKEN'),
      options: {
        timeout: 5000,
        idempotencyKey: 'abc',
      },
    })
    this.payment = new Payment(this.client)
    this.preference = new Preference(this.client)
  }

  /**
   * Cria uma preferência para Checkout Pro
   */
  async createPreference(order: Order): Promise<PaymentResult> {
    try {
      const preferenceData: PreferenceCreateData = {
        body: {
          items: order.items.map((item) => ({
            id: item.product.id,
            title: item.product.name,
            description: item.product.description || '',
            quantity: item.quantity,
            unit_price: Number(Number(item.price).toFixed(2)),
            currency_id: 'BRL',
          })),
          payer: {
            email: order.user.email,
            name: order.user.fullName ?? '',
            identification: {
              type: 'CPF',
              number: '11144477735', // CPF de teste
            },
          },
          back_urls: {
            success: `${env.get('PUBLIC_APP_URL')}/checkout/${order.id}`,
            failure: `${env.get('PUBLIC_APP_URL')}/checkout/${order.id}`,
            pending: `${env.get('PUBLIC_APP_URL')}/checkout/${order.id}`,
          },
          auto_return: 'approved',
          external_reference: order.id,
          notification_url: `${env.get('PUBLIC_APP_URL')}/api/webhooks/mercado-pago`,
          metadata: {
            order_id: order.id,
            user_id: order.user.id,
          },
        },
      }

      const createdPreference = await this.preference.create(preferenceData)

      return {
        id: createdPreference.id?.toString() ?? '',
        status: 'pending',
        qrCode: undefined,
        qrCodeBase64: undefined,
        externalReference: order.id,
        provider: PaymentProviderType.MERCADO_PAGO,
        checkoutUrl: createdPreference.init_point ?? undefined,
        preferenceId: createdPreference.id?.toString() ?? undefined,
        initPoint: createdPreference.init_point ?? undefined,
        sandboxInitPoint: createdPreference.sandbox_init_point ?? undefined,
      }
    } catch (error) {
      console.error('Error creating preference', error)
      throw new Error('Error creating preference')
    }
  }

  /**
   * Cria um pagamento para um pedido
   * Decide internamente se usa PIX ou Checkout Pro baseado no paymentMethod
   */
  async createPayment(order: Order): Promise<PaymentResult> {
    if (order.paymentMethod === 'PIX') {
      return await this.createPaymentPix(order)
    } else {
      return await this.createPreference(order)
    }
  }

  /**
   * Cria um pagamento PIX para um pedido
   */
  async createPaymentPix(order: Order): Promise<PaymentResult> {
    try {
      const amount = Number(Number(order.total).toFixed(2))

      if (amount < 0.01) {
        throw new Error('Valor mínimo para pagamento é R$ 0,01')
      }

      const paymentCreateData: PaymentCreateData = {
        body: {
          transaction_amount: amount,
          description: `Pedido #${order.id} - QuelMerce`,
          payment_method_id: 'pix',
          payer: {
            email: order.user.email,
            identification: {
              type: 'CPF',
              number: '11144477735',
            },
          },
          external_reference: order.id,
          notification_url: `${env.get('PUBLIC_APP_URL')}/api/webhooks/mercado-pago`,
          metadata: {
            order_id: order.id,
            user_id: order.user.id,
          },
        },
      }

      const createdPayment = await this.payment.create(paymentCreateData)

      return {
        id: createdPayment.id?.toString() ?? '',
        status: createdPayment.status ?? '',
        qrCode: createdPayment.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: createdPayment.point_of_interaction?.transaction_data?.qr_code_base64,
        externalReference: createdPayment.external_reference ?? '',
        provider: PaymentProviderType.MERCADO_PAGO,
      }
    } catch (error) {
      console.error('Error creating payment', error)
      throw new Error('Error creating payment')
    }
  }

  /**
   * Busca informações de um pagamento
   */
  async getPayment(paymentId: string) {
    try {
      const result = await this.payment.get({ id: paymentId })
      return result
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error)
      throw new Error('Falha ao buscar informações do pagamento')
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(paymentId: string) {
    try {
      const result = await this.payment.cancel({ id: paymentId })
      return result
    } catch (error: any) {
      console.error('Erro ao cancelar pagamento:', error)

      if (error.message?.includes('resource not found') || error.error === 'resource not found') {
        return { status: 'cancelled', message: 'Pagamento não encontrado' }
      }

      throw new Error('Falha ao cancelar pagamento')
    }
  }

  /**
   * Processa notificação de webhook
   */
  async processWebhook(data: any): Promise<{ orderId: string; status: string } | null> {
    try {
      const { type, data: webhookData } = data

      if (type === 'payment') {
        const paymentId = webhookData.id
        const payment = await this.getPayment(paymentId)

        return {
          orderId: payment.external_reference ?? '',
          status: payment.status ?? '',
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao processar webhook:', error)
      return null
    }
  }
}
