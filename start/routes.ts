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

const VehiclesController = () => import('#controllers/vehicles_controller')
const UsersController = () => import('#controllers/users_controller')
const BrandsController = () => import('#controllers/brands_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const ProductsController = () => import('#controllers/products_controller')
const OrderController = () => import('#controllers/order_controller')

router
  .group(() => {
    router.on('/').render('pages/home')
    router.on('/cart').render('pages/cart')
    router.on('/login').render('pages/login')
    router.on('/products/:id').render('pages/product-details')
  })
  .middleware(middleware.silent_auth())

router
  .group(() => {
    router.on('/checkout/:id').render('pages/checkout')
    router.on('/my-profile').render('pages/my-profile')
    router.on('/verify-email').render('pages/verify-email')
  })
  .middleware(middleware.auth())

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
  })
  .prefix('api')
