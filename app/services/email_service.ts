import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import Order from '#models/order'

export class EmailService {
  public async sendMagicLink(toEmail: string, user: User, code: string) {
    const magicLink = `${env.get('PUBLIC_APP_URL')}/magic-link/${code}`

    try {
      await mail.send((message) => {
        message
          .from('no-reply@quelmerce.com')
          .to(toEmail)
          .subject(`Código de verificação para QuelMerce: ${code}`)
          .htmlView('mails/welcome', { user, link: magicLink })
      })
    } catch (error) {
      console.error('Error sending magic link', error)
    }
  }

  public async sendOrderCancellationEmail(
    user: User,
    order: Order,
    reason?: string,
    wasPaid?: boolean
  ) {
    try {
      const appUrl = env.get('PUBLIC_APP_URL')
      await mail.send((message) => {
        message
          .from('no-reply@quelmerce.com')
          .to(user.email)
          .subject(`Pedido #${order.id} foi cancelado - QuelMerce`)
          .htmlView('mails/order-cancelled', {
            user,
            order,
            reason,
            isPaid: wasPaid,
            appUrl,
          })
      })
    } catch (error) {
      console.error('Error sending order cancellation email', error)
    }
  }

  public async sendOrderConfirmationEmail(user: User, order: Order) {
    try {
      const appUrl = env.get('PUBLIC_APP_URL')
      await mail.send((message) => {
        message
          .from('no-reply@quelmerce.com')
          .to(user.email)
          .subject(`Pedido #${order.id} criado com sucesso - QuelMerce`)
          .htmlView('mails/order-created', {
            user,
            order,
            appUrl,
          })
      })
    } catch (error) {
      console.error('Error sending order confirmation email', error)
    }
  }
}
