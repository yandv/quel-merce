/**
 * Serviço para geração de slugs únicos
 */
export default class SlugService {
  /**
   * Gera um slug a partir de uma string
   */
  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Gera um slug único para um modelo
   */
  static async generateUniqueSlug(
    baseSlug: string,
    model: any,
    excludeId?: string
  ): Promise<string> {
    let slug = this.generateSlug(baseSlug)
    let counter = 1
    let originalSlug = slug

    while (true) {
      const query = model.query().where('slug', slug)

      if (excludeId) {
        query.where('id', '!=', excludeId)
      }

      const existing = await query.first()

      if (!existing) {
        return slug
      }

      slug = `${originalSlug}-${counter}`
      counter++
    }
  }
}
