import type { HttpContext } from '@adonisjs/core/http'
import { PaymentManagerService } from '#services/payment_manager_service'
import { PaymentProviderType } from '../types/enums/payment_providers.enum.js'
import { StripeService } from '#services/stripe_service'
import { inject } from '@adonisjs/core'

@inject()
export default class WebhookController {
  constructor(
    private paymentManagerService: PaymentManagerService,
    private stripeService: StripeService
  ) {}

  /**
   * POST /api/webhooks/mercado-pago
   * Webhook para receber notificações do Mercado Pago
   */
  async executeMercadoPago({ request, response }: HttpContext) {
    try {
      const webhookData = request.body()
      await this.paymentManagerService.updatePaymentFromWebhook(
        PaymentProviderType.MERCADO_PAGO,
        webhookData
      )

      return response.status(200).json({ received: true })
    } catch (error) {
      console.error('Erro no webhook do Mercado Pago:', error)
      return response.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * POST /api/webhooks/stripe
   * Webhook para receber notificações do Stripe
   */
  async executeStripe({ request, response }: HttpContext) {
    try {
      const body = request.raw()
      const signature = request.header('stripe-signature')

      if (!signature || !body) {
        return response.status(400).json({ error: 'Missing stripe-signature header or body' })
      }

      const webhookData = this.stripeService.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )

      // Process webhook
      const result = await this.stripeService.processWebhook(webhookData)

      if (result) {
        // Update payment status
        await this.paymentManagerService.updatePaymentFromWebhook(
          PaymentProviderType.STRIPE,
          webhookData
        )
      }

      return response.status(200).json({ received: true })
    } catch (error) {
      console.error('Erro no webhook do Stripe:', error)
      return response.status(400).json({ error: 'Webhook signature verification failed' })
    }
  }
}
