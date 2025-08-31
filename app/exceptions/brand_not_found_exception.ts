import DomainException from './domain_exception.js'

export default class BrandNotFoundException extends DomainException {
  static status = 404
  static code = 'E_BRAND_NOT_FOUND'
  static message = 'Marca não encontrada'
}
