import DomainException from '#exceptions/domain_exception'

export default class ProductNotFoundException extends DomainException {
  static status = 400
  static code = 'PRODUCT_NOT_FOUND'
  static message = 'Produto não encontrado na base de dados'

  constructor(productIds?: string[]) {
    const message =
      productIds && productIds.length > 0
        ? `Os seguintes produtos não foram encontrados: ${productIds.join(', ')}`
        : ProductNotFoundException.message
    super(message)
  }
}
