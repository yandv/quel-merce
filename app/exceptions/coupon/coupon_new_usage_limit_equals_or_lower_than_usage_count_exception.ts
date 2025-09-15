import DomainException from '../domain_exception.js'

export default class CouponNewUsageLimitEqualsOrLowerThanUsageCountException extends DomainException {
  static status = 400
  static code = 'COUPON_NEW_USAGE_LIMIT_EQUALS_OR_LOWER_THAN_USAGE_COUNT'
  static message = 'O novo limite de uso do cupom é igual ou menor que o uso atual'
}
