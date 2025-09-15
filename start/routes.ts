/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { UserRole } from '#models/user'

const VehiclesController = () => import('#controllers/vehicles_controller')
const UsersController = () => import('#controllers/users_controller')
const BrandsController = () => import('#controllers/brands_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const ProductsController = () => import('#controllers/products_controller')
const OrderController = () => import('#controllers/order_controller')
const CouponsController = () => import('#controllers/coupons_controller')

router
  .group(() => {
    router.on('/').render('pages/home')
    router.on('/cart').render('pages/cart')
    router.on('/login').render('pages/login')
    router.on('/products/:id').render('pages/product-details')
    router.on('/verify-email').render('pages/verify-email')
    router.on('/magic-link/:code').render('pages/magic-link')
    router.on('/forbidden').render('pages/forbidden')
    router.on('/not-found').render('pages/not-found')
    router.on('/server-error').render('pages/server-error')
  })
  .middleware(middleware.silent_auth())

router
  .group(() => {
    router.on('/checkout/:id').render('pages/checkout')
    router.on('/my-profile').render('pages/my-profile')
  })
  .middleware(middleware.auth())

router
  .group(() => {
    router.on('/').render('pages/admin/home')
    router.on('/users').render('pages/admin/users')
    router.on('/orders').render('pages/admin/orders')
    router.on('/coupons').render('pages/admin/coupons')
    router.on('/settings').render('pages/admin/settings')
    router.on('/products').render('pages/admin/products')
  })
  .prefix('admin')
  .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.CUSTOMER })])

router.get('/default-avatar.png', (ctx) => {
  const base64 =
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAqwMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABgcBBAUDAv/EADgQAAIBAwEFAwkGBwAAAAAAAAABAgMEEQUGITFBURJhcRMiQlKBkaGx0RQjMmLB4SQzNUNyc/D/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAARH/2gAMAwEAAhEDEQA/ALSABpkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAampajbabb+Xup4XCMVxk+iIXqW09/duUaMna0uUab85+36FE/Sb5DGOJVE69apLtTrVJS6ym2zas9Y1CzlmjdVcerOXai/YyGrNBwtD2ko6jJULiKo3T4LPmz8O/uO6UAAQAAAAAAAAAAAAAAAADyua9O2t6lerLFOnFyk+5HqRjbq8cLWhZxe+q3OfguC9/wAgIvquo1dTvJXFXKi90IerHoaYBpAAAE2mmnhren0LA2X1Z6laOnXf8TR3S/OuTK/Ojs9duz1i2q5xGU1Tn4Pd88MlVZQGMAgAAAAAAAAAAAAAAAAEG24berUk3uVFY97JyQnbqm46hb1MfjpY9z/cCNAA0gAABmLxOLXFNGD0oQ8pXpQ9aaj72Si1YPNOLfNI+jCXZSiuSMkUAAAAAAAAAAAAAAAAI/tpZu40yNxBPt28u08eq9z/AEZIDE4xnBxnFSjJYafNAVKDs7QaHV0ytKpTi5Wkn5s16HczjGkAAAOzsnZu71ilP+3Q+8k+/l8fkcy0ta95XVC2pupUfJcl1fRFiaHpVPSbPyUcOrJ9qrNek/oiUdEAEUAAAAAAAAAAAAAAAAAAGGlKLi96fFPmca82Y0y6k5KnKhN8XSePhwOheahZ2Kzd3NOm/Vct/uORcbX6dTeKcK9XHOMML4tAa72Lt8+be1ku+CbPehsfp9OSdatXq9zaivgv1Nd7aUc+bY1cd9VfQ9aW2dm3idrcR712ZY+IMd6ztLeypeTtaMKcM5xFYz49T3OZaa/pl21GndRjJ8qnm/M6SaaynldUUZABAAAAAAAAAAAAAAADQ1jVKGlWvlauJVJZVOmnvk/oB7X99bafQda6qKEeC5uT6JEM1Xam8u5ShaN21HON3434vl7Dkahe3GoXDr3U+1LglyiuiNcpWW25OUm3J8W3lswAVAAAHvN7TtWvtOkvs1d9hcac98X7PoaIAsHRdorbUuzSqfc3L9CT3S/xf6HaKly85y0+pMtmdovtEo2WoT+9e6lVb/G+j7+/mRUoABAAAAAAAAAAAHncVqdtQqV6z7NOnFyk+iK01fUKup3s69VtR4QhyjHoSPbi/cVT0+D4/eVPD0V8GyIFAAFQAAAAAAAAMp4aa3PqYAFg7L6s9Ss/J1pZuaKSm/XXJnaKx0a/em6jSuU/MTxUXWL4/wDdxZ2U0sPK5PqRYAAgAAAAAAB4X1V0LG5qrjClKS8cFFb6xdfbdUubjOVKo1HwW5fBGmFwXgAgACgAAAAAAAAAABYuy119q0Wg3+KmvJy9n7YK6JjsFVbt7yjyjOMl7U/oiCVAAigAAAAAaGu/0W9/0yMgorIAFQAAAAAAAAAAAAACVbA/z71flj82ZAEwABFAAQf/2Q=='

  const buffer = Buffer.from(base64, 'base64')

  ctx.response.type('image/png')
  ctx.response.send(buffer)
})

router
  .group(() => {
    router
      .group(() => {
        router.get(':plate', [VehiclesController, 'getVehicleInfoByPlate'])
      })
      .prefix('vehicles')

    router
      .group(() => {
        router.get(':id', [UsersController, 'getUserById'])
        router.patch(':id', [UsersController, 'updateProfile']).middleware(middleware.auth())

        router.get(':id/vehicles', [UsersController, 'getUserVehicles'])
        router.post(':id/vehicles/:vehicleId', [UsersController, 'attachVehicle'])
        router.delete(':id/vehicles/:vehicleId', [UsersController, 'detachVehicle'])

        router.get(':id/orders', [UsersController, 'getUserOrders'])

        router.post('/login', [UsersController, 'login'])
        router.post('/logout', [UsersController, 'logout'])
        router.post('/', [UsersController, 'register'])
        router.post('/verify-email/:code', [UsersController, 'verifyEmail'])
        router.get('/verification-code-status/:email', [
          UsersController,
          'getVerificationCodeStatus',
        ])
        router.post('/resend-verification-email/:email', [
          UsersController,
          'resendVerificationEmail',
        ])
      })
      .prefix('users')

    router
      .group(() => {
        router.get('/', [BrandsController, 'getBrands'])
        router.get(':id/models', [BrandsController, 'getModels'])
        router.get(':id/models/:modelId/years', [BrandsController, 'getYears'])
      })
      .prefix('brands')

    router
      .group(() => {
        router.get('/', [CategoriesController, 'getCategories'])
        router.get(':id/products', [CategoriesController, 'getCategoryProducts'])
      })
      .prefix('categories')

    router
      .group(() => {
        router.get('/', [ProductsController, 'getProducts'])
        router.get(':id', [ProductsController, 'getProductById'])
      })
      .prefix('products')

    router
      .group(() => {
        router.post('/', [OrderController, 'createOrder'])
        router.get(':id', [OrderController, 'getOrderById'])
      })
      .prefix('orders')
      .middleware(middleware.auth())

    router
      .group(() => {
        router
          .group(() => {
            router.get('/summary', [CouponsController, 'getCouponSummary'])
            router.get('/', [CouponsController, 'getCoupons'])
            router.post('/', [CouponsController, 'createCoupon'])
            router.patch('/:id', [CouponsController, 'updateCouponById'])
            router.delete('/:id', [CouponsController, 'deleteCouponById'])
          })
          .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.CUSTOMER })])

        router.get('/:code', [CouponsController, 'getCouponByCode'])
      })
      .prefix('coupons')
      .middleware(middleware.auth())
  })
  .prefix('api')
