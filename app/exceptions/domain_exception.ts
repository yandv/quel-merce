import { Exception } from '@adonisjs/core/exceptions'

export default abstract class DomainException extends Exception {
  /**
   * Status HTTP padrão para exceções de domínio
   */
  static status = 400

  /**
   * Código único da exceção
   */
  static code: string

  /**
   * Mensagem padrão da exceção
   */
  static message: string

  /**
   * Construtor que permite sobrescrever a mensagem
   */
  constructor(message?: string) {
    super(message)
  }
}
