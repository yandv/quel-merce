import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { RoleHierarchy, UserRole } from '#models/user'

export default class RoleMiddleware {
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

      const html = await ctx.view.render('pages/not-found')

      return ctx.response.send(html)
    }

    return next()
  }
}
