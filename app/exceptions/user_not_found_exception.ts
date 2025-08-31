import DomainException from './domain_exception.js'

export default class UserNotFoundException extends DomainException {
  static status = 404
  static code = 'E_USER_NOT_FOUND'
  static message = 'Usuário não encontrado'
}
