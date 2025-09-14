import DomainException from '../domain_exception.js'

export default class CategoryNotFoundException extends DomainException {
  static status = 404
  static code = 'CATEGORY_NOT_FOUND'
  static message = 'Categoria não encontrada'
}
