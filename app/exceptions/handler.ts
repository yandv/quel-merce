import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import DomainException from '#exceptions/domain_exception'
import InternalServerErrorException from '#exceptions/internal_server_error_exception'
import { errors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected readonly debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected readonly renderStatusPages = true

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected readonly statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { view }) => {
      return view.render('pages/not-found', { error })
    },
    '403': (error, { view }) => {
      return view.render('pages/forbidden', { error })
    },
    '500..599': (error, { view }) => {
      return view.render('pages/server-error', { error })
    },
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // Se for uma rota da API, sempre retornar JSON
    if (ctx.request.url().startsWith('/api/')) {
      if (error instanceof DomainException) {
        return ctx.response.status(error.status).json({
          success: false,
          message: error.message,
          code: error.code,
        })
      }

      if (error instanceof errors.E_VALIDATION_ERROR) {
        return ctx.response.status(422).json({
          success: false,
          message: 'Erro de validação',
          errors: error.messages,
        })
      }

      if ('status' in (error as any)) {
        return ctx.response.status((error as any).status).json({
          message: (error as any).message,
          code: (error as any).code,
        })
      }

      const internalError = new InternalServerErrorException()
      return ctx.response.status(internalError.status).json({
        success: false,
        message: internalError.message,
        code: internalError.code,
      })
    }

    // Para rotas não-API, usar o comportamento padrão
    if (error instanceof DomainException) {
      return ctx.response.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    if (error instanceof errors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).send(error)
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
