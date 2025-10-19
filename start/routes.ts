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
const YearsController = () => import('#controllers/years_controller')
const DashboardController = () => import('#controllers/dashboard_controller')

router
  .group(() => {
    router.on('/').render('pages/home')
    router.on('/cart').render('pages/cart')
    router.on('/login').render('pages/login')
    router.on('/products/:slug').render('pages/product-details')
    router.on('/category/:slug').render('pages/category')
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
    router.on('/orders/:id').render('pages/admin/order-details')
    router.on('/coupons').render('pages/admin/coupons')
    router.on('/settings').render('pages/admin/settings')
    router.on('/products').render('pages/admin/products')
  })
  .prefix('admin')
  .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.SELLER })])

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

    // Admin Users API
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [UsersController, 'getUsers'])
            router.get('/summary', [UsersController, 'getUsersSummary'])
            router
              .patch('/:id/admin', [UsersController, 'adminUpdateUser'])
              .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.ADMIN })])
          })
          .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.SELLER })])
      })
      .prefix('admin/users')

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
        router.get(':slug', [CategoriesController, 'getCategory'])
        router.get(':slug/products', [CategoriesController, 'getCategoryProducts'])
      })
      .prefix('categories')

    router
      .group(() => {
        router.get('/', [YearsController, 'getYears'])
      })
      .prefix('years')
      .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.SELLER })])

    router
      .group(() => {
        router.get('/', [ProductsController, 'getProducts'])
        router
          .get('/summary', [ProductsController, 'getProductSummary'])
          .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.SELLER })])
        router.get(':slug', [ProductsController, 'getProductBySlug'])
        router
          .post('/', [ProductsController, 'createProduct'])
          .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.ADMIN })])
        router
          .patch('/:id', [ProductsController, 'updateProduct'])
          .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.ADMIN })])
        router
          .delete('/:id', [ProductsController, 'deleteProduct'])
          .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.ADMIN })])
      })
      .prefix('products')

    router
      .group(() => {
        router.post('/', [OrderController, 'createOrder'])
        router
          .get('/', [OrderController, 'getOrders'])
          .middleware([middleware.role({ requiredRole: UserRole.SELLER })])
        router
          .get('/sales-last-7-days', [OrderController, 'getSalesLast7Days'])
          .middleware([middleware.role({ requiredRole: UserRole.SELLER })])
        router
          .get('/summary', [OrderController, 'getOrderSummary'])
          .middleware([middleware.role({ requiredRole: UserRole.SELLER })])
        router.get(':id', [OrderController, 'getOrderById'])
        router
          .patch(':id/cancel', [OrderController, 'cancelOrder'])
          .middleware([middleware.role({ requiredRole: UserRole.SELLER })])
      })
      .prefix('orders')
      .middleware(middleware.auth())

    router
      .group(() => {
        router
          .group(() => {
            router.post('/', [CouponsController, 'createCoupon'])
            router.patch('/:id', [CouponsController, 'updateCouponById'])
            router.delete('/:id', [CouponsController, 'deleteCouponById'])
          })
          .middleware([middleware.role({ requiredRole: UserRole.ADMIN })])

        router
          .group(() => {
            router.get('/summary', [CouponsController, 'getCouponSummary'])
            router.get('/', [CouponsController, 'getCoupons'])
          })
          .middleware([middleware.role({ requiredRole: UserRole.SELLER })])

        router.get('/:code', [CouponsController, 'getCouponByCode'])
      })
      .prefix('coupons')
      .middleware(middleware.auth())

    router
      .group(() => {
        router
          .get('/stats', [DashboardController, 'getDashboardStats'])
          .middleware([middleware.auth(), middleware.role({ requiredRole: UserRole.SELLER })])
      })
      .prefix('dashboard')
  })
  .prefix('api')
