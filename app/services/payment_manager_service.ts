import Payment, { PaymentStatus } from '#models/payment'
import Order, { OrderPaymentStatus } from '#models/order'
import { PaymentService } from './payment_service.js'
import { EmailService } from './email_service.js'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'

@inject()
export class PaymentManagerService {
  constructor(
    private paymentService: PaymentService,
    private emailService: EmailService
  ) {}

  /**
   * Cria um pagamento para um pedido
   */
  async createPaymentForOrder(order: Order): Promise<Payment> {
    const paymentResult = await this.paymentService.createPayment(order)
    const payment = await Payment.create({
      orderId: order.id,
      provider: paymentResult.provider as any,
      providerId: paymentResult.id,
      status: this.mapProviderStatusToPaymentStatus(paymentResult.status),
      amount: order.total,
      qrCode: paymentResult.qrCode,
      qrCodeBase64: paymentResult.qrCodeBase64,
      providerStatus: paymentResult.status,
      checkoutUrl: paymentResult.checkoutUrl,
      preferenceId: paymentResult.preferenceId,
      initPoint: paymentResult.initPoint,
      sandboxInitPoint: paymentResult.sandboxInitPoint,
      metadata: {
        externalReference: paymentResult.externalReference,
        provider: paymentResult.provider,
      },
    })

    return payment
  }

  /**
   * Atualiza status do pagamento baseado no webhook
   */
  async updatePaymentFromWebhook(providerType: string, webhookData: any): Promise<Payment | null> {
    const result = await this.paymentService.processWebhook(providerType, webhookData)

    if (!result) {
      return null
    }

    const payment = await Payment.findBy('orderId', result.orderId)

    if (!payment) {
      return null
    }

    const newStatus = this.mapProviderStatusToPaymentStatus(result.status)

    payment.status = newStatus
    payment.providerStatus = result.status

    if (newStatus === PaymentStatus.APPROVED) {
      payment.paidAt = DateTime.now()
    }

    await payment.save()

    const order = await payment.related('order').query().first()

    if (order) {
      if (newStatus === PaymentStatus.APPROVED) {
        order.paymentStatus = OrderPaymentStatus.PAID
        order.paidAt = DateTime.now()

        await order.load('user')
        await order.load('items', (itemsQuery) => {
          itemsQuery.preload('product')
        })

        await this.emailService.sendPaymentApprovedEmail(order.user, order)
      } else if (newStatus === PaymentStatus.CANCELLED || newStatus === PaymentStatus.REJECTED) {
        order.paymentStatus = OrderPaymentStatus.CANCELLED
      }

      await order.save()
      console.info(`The order ${order?.id} was updated to status ${order?.paymentStatus}`)
    }

    return payment
  }

  /**
   * Busca pagamento de um pedido
   */
  async getPaymentByOrder(orderId: string): Promise<Payment | null> {
    return await Payment.findBy('orderId', orderId)
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(paymentId: string): Promise<Payment | null> {
    const payment = await Payment.find(paymentId)
    if (!payment) {
      return null
    }

    await this.paymentService.cancelPayment(payment.providerId, payment.provider)
    payment.status = PaymentStatus.CANCELLED
    await payment.save()

    return payment
  }

  /**
   * Mapeia status do provedor para status interno
   */
  private mapProviderStatusToPaymentStatus(providerStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      approved: PaymentStatus.APPROVED,
      pending: PaymentStatus.PENDING,
      cancelled: PaymentStatus.CANCELLED,
      rejected: PaymentStatus.REJECTED,
      refunded: PaymentStatus.REFUNDED,
    }

    return statusMap[providerStatus.toLowerCase()] || PaymentStatus.PENDING
  }
}
