import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { RoleHierarchy, UserRole } from '#models/user'

/**
 * Role middleware is used to authorize HTTP requests based on user roles.
 * The user must be authenticated and have a role greater than or equal to the required role.
 * Role hierarchy: ADMIN > CUSTOMER > USER
 */
export default class RoleMiddleware {
  /**
   * The URL to redirect to, when authorization fails
   */
  redirectTo = '/forbidden'

  /**
   * Role hierarchy mapping for comparison
   */

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      requiredRole: UserRole
    }
  ) {
    if (!ctx.auth.user) {
      if (ctx.request.url().startsWith('/api')) {
        return ctx.response.status(401).json({
          message: 'Not authorized',
        })
      }
      return ctx.response.redirect('/login')
    }

    const userRoleLevel = RoleHierarchy[ctx.auth.user.role]
    const requiredRoleLevel = RoleHierarchy[options.requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      if (ctx.request.url().startsWith('/api')) {
        return ctx.response.status(403).json({
          message: `Access denied.`,
        })
      }
      return ctx.response.redirect(this.redirectTo)
    }

    return next()
  }
}
