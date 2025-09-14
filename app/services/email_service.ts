import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export class EmailService {
  public async sendMagicLink(toEmail: string, user: User, code: string) {
    const magicLink = `${env.get('PUBLIC_APP_URL')}/magic-link/${code}`

    try {
      await mail.send((message) => {
        message
          .from('no-reply@quelmerce.com')
          .to(toEmail)
          .subject(`Verifique seu email ${code}`)
          .htmlView('mails/welcome', { user, link: magicLink })
      })
    } catch (error) {
      console.error('Error sending magic link', error)
    }
  }
}
