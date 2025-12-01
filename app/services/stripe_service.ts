import Stripe from 'stripe'
import { PaymentProvider, PaymentResult } from '../types/interfaces/payment_provider.js'
import { PaymentProviderType } from '../types/enums/payment_providers.enum.js'
import Order from '#models/order'
import env from '#start/env'

export class StripeService implements PaymentProvider {
  public stripe: Stripe

  constructor() {
    this.stripe = new Stripe(env.get('STRIPE_ACCESS_TOKEN')!, {
      apiVersion: '2025-09-30.clover',
    })
  }

  /**
   * Cria um pagamento para um pedido
   */
  async createPayment(order: Order): Promise<PaymentResult> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: order.items.map((item) => ({
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.product.name,
              ...(item.product.description && { description: item.product.description }),
            },
            unit_amount: Math.round(Number(item.price) * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${env.get('PUBLIC_APP_URL')}/checkout/${order.id}?success=true`,
        cancel_url: `${env.get('PUBLIC_APP_URL')}/checkout/${order.id}?canceled=true`,
        metadata: {
          order_id: order.id,
          user_id: order.user.id,
        },
        customer_email: order.user.email,
      })

      return {
        id: session.id,
        status: 'pending',
        qrCode: undefined,
        qrCodeBase64: undefined,
        externalReference: order.id,
        provider: PaymentProviderType.STRIPE,
        checkoutUrl: session.url ?? undefined,
      }
    } catch (error) {
      console.error('Error creating Stripe checkout session', error)
      throw new Error('Error creating Stripe checkout session', { cause: error })
    }
  }

  /**
   * Busca informações de um pagamento
   */
  async getPayment(paymentId: string): Promise<any> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentId)
    } catch (error) {
      console.error('Error retrieving Stripe payment', error)
      throw new Error('Error retrieving Stripe payment', { cause: error })
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(paymentId: string): Promise<any> {
    try {
      return await this.stripe.paymentIntents.cancel(paymentId)
    } catch (error: any) {
      console.error('Error canceling Stripe payment', error)

      // Se o erro for "resource not found", não é um erro crítico
      if (error.message?.includes('resource not found') || error.code === 'resource_missing') {
        return { status: 'canceled', message: 'Pagamento não encontrado' }
      }

      throw new Error('Falha ao cancelar pagamento', { cause: error })
    }
  }

  /**
   * Processa notificação de webhook
   */
  async processWebhook(data: any): Promise<{ orderId: string; status: string } | null> {
    try {
      const { type, data: webhookData } = data

      if (type === 'checkout.session.completed') {
        const session = webhookData.object
        const orderId = session.metadata.order_id

        if (orderId && session.payment_status === 'paid') {
          return {
            orderId,
            status: 'approved',
          }
        }
      }

      if (type === 'checkout.session.expired') {
        const session = webhookData.object
        const orderId = session.metadata.order_id

        if (orderId) {
          return {
            orderId,
            status: 'rejected',
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error processing Stripe webhook', error)
      return null
    }
  }
}
