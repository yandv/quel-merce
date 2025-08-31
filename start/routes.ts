/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const VehiclesController = () => import('#controllers/vehicles_controller')
const UsersController = () => import('#controllers/users_controller')
const BrandsController = () => import('#controllers/brands_controller')
const CategoriesController = () => import('#controllers/categories_controller')

router.on('/').render('pages/home')

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
        router.get(':id/vehicles', [UsersController, 'getUserVehicles'])
        router.post(':id/vehicles/:vehicleId', [UsersController, 'attachVehicle'])
        router.delete(':id/vehicles/:vehicleId', [UsersController, 'detachVehicle'])
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
  })
  .prefix('api')
