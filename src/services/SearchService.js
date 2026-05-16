/**
 * 🎯 SearchService.js
 * Recherche multicritère et filtrage produits
 * 
 * Critères:
 * - Nom (recherche partielle)
 * - Catégorie
 * - Prix (min/max)
 */

import { ApiService } from './ApiService'

export const SearchService = {
  /**
   * Recherche avec filtres
   * @param {object} filters - {name, categoryId, priceMin, priceMax}
   * @param {array} products - (Optional) Produits locaux à filtrer
   * @returns {array} Produits filtrés
   */
  search(filters = {}, products = null) {
    console.log('🔍 Recherche:', filters)

    // Si produits locaux fournis, les filtrer
    if (Array.isArray(products)) {
      return this.filterLocal(filters, products)
    }

    // Sinon, construire requête API
    return this.buildQuery(filters)
  },

  /**
   * Filtrer produits localement
   * @param {object} filters - Critères de filtrage
   * @param {array} products - Produits à filtrer
   * @returns {array} Résultats filtrés
   */
  filterLocal(filters, products) {
    if (!Array.isArray(products)) {
      console.warn('⚠️ Pas de produits fournis')
      return []
    }

    let results = [...products]

    // Filtre nom
    if (filters.name && filters.name.trim()) {
      const searchTerm = filters.name.toLowerCase()
      results = results.filter(p =>
        p.name?.toLowerCase().includes(searchTerm) ||
        p.reference?.toLowerCase().includes(searchTerm)
      )
      console.log(`  → Nom: "${filters.name}" (${results.length} résultats)`)
    }

    // Filtre catégorie
    if (filters.categoryId && filters.categoryId !== '') {
      results = results.filter(p => p.category_id == filters.categoryId)
      console.log(`  → Catégorie: ${filters.categoryId} (${results.length} résultats)`)
    }

    // Filtre prix min
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      const priceMin = parseFloat(filters.priceMin)
      if (!isNaN(priceMin)) {
        results = results.filter(p => parseFloat(p.price) >= priceMin)
        console.log(`  → Prix min: ${priceMin}€ (${results.length} résultats)`)
      }
    }

    // Filtre prix max
    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      const priceMax = parseFloat(filters.priceMax)
      if (!isNaN(priceMax)) {
        results = results.filter(p => parseFloat(p.price) <= priceMax)
        console.log(`  → Prix max: ${priceMax}€ (${results.length} résultats)`)
      }
    }

    console.log(`✓ Recherche complète: ${results.length} produit(s)`)
    return results
  },

  /**
   * Construire requête API pour recherche
   * @param {object} filters - Critères
   * @returns {string} Requête formatée
   */
  buildQuery(filters) {
    let query = ''

    if (filters.name) {
      query += `&search=${encodeURIComponent(filters.name)}`
    }
    if (filters.categoryId) {
      query += `&category=${filters.categoryId}`
    }
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      query += `&price_min=${filters.priceMin}`
    }
    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      query += `&price_max=${filters.priceMax}`
    }

    return query
  },

  /**
   * Obtenir catégories disponibles
   * @returns {array} Liste catégories
   */
  async getCategories() {
    try {
      // Simulé - à adapter selon source données
      return [
        { id: 1, name: 'Électronique' },
        { id: 2, name: 'Accessoires' },
        { id: 3, name: 'Vêtements' },
        { id: 4, name: 'Livres' }
      ]
    } catch (error) {
      console.error('Erreur récupération catégories:', error)
      return []
    }
  },

  /**
   * Suggestions de recherche
   * @param {string} term - Terme saisi
   * @param {array} products - Produits disponibles
   * @returns {array} Suggestions (max 5)
   */
  getSuggestions(term, products = []) {
    if (!term || term.length < 2) return []

    const searchTerm = term.toLowerCase()
    
    const suggestions = products
      .filter(p =>
        p.name?.toLowerCase().includes(searchTerm) ||
        p.reference?.toLowerCase().includes(searchTerm)
      )
      .map(p => ({
        text: p.name,
        productId: p.id
      }))
      .slice(0, 5)

    return suggestions
  },

  /**
   * Obtenir plage de prix disponibles
   * @param {array} products - Produits
   * @returns {object} {min, max, avg}
   */
  getPriceRange(products = []) {
    if (products.length === 0) {
      return { min: 0, max: 0, avg: 0 }
    }

    const prices = products.map(p => parseFloat(p.price) || 0)
    
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
      avg: Math.round(prices.reduce((a, b) => a + b) / prices.length)
    }
  },

  /**
   * Trier produits
   * @param {array} products - Produits
   * @param {string} sortBy - 'name' | 'price-asc' | 'price-desc' | 'newest'
   * @returns {array} Produits triés
   */
  sortProducts(products, sortBy = 'name') {
    const sorted = [...products]

    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'price-asc':
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
      case 'price-desc':
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case 'newest':
        sorted.sort((a, b) =>
          new Date(b.date_add) - new Date(a.date_add)
        )
        break
    }

    return sorted
  },

  /**
   * Paginer résultats
   * @param {array} products - Produits
   * @param {number} page - Numéro page (1-indexed)
   * @param {number} pageSize - Taille page (défaut 12)
   * @returns {object} {items, page, pageSize, total, totalPages}
   */
  paginate(products, page = 1, pageSize = 12) {
    const total = products.length
    const totalPages = Math.ceil(total / pageSize)
    const pageNum = Math.max(1, Math.min(page, totalPages))
    
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const items = products.slice(start, end)

    return {
      items,
      page: pageNum,
      pageSize,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  },

  /**
   * Valider filtres
   * @param {object} filters - Filtres à valider
   * @returns {object} {valid, errors, cleaned}
   */
  validateFilters(filters) {
    const errors = []
    const cleaned = { ...filters }

    // Valider priceMin
    if (cleaned.priceMin !== null && cleaned.priceMin !== undefined) {
      const price = parseFloat(cleaned.priceMin)
      if (isNaN(price) || price < 0) {
        errors.push('Prix minimum invalide')
        delete cleaned.priceMin
      }
    }

    // Valider priceMax
    if (cleaned.priceMax !== null && cleaned.priceMax !== undefined) {
      const price = parseFloat(cleaned.priceMax)
      if (isNaN(price) || price < 0) {
        errors.push('Prix maximum invalide')
        delete cleaned.priceMax
      }
    }

    // Vérifier cohérence min/max
    if (cleaned.priceMin && cleaned.priceMax) {
      if (parseFloat(cleaned.priceMin) > parseFloat(cleaned.priceMax)) {
        errors.push('Prix minimum > prix maximum')
      }
    }

    // Valider nom
    if (cleaned.name) {
      cleaned.name = cleaned.name.trim().substring(0, 50)
    }

    return {
      valid: errors.length === 0,
      errors,
      cleaned
    }
  },

  /**
   * Réinitialiser filtres
   * @returns {object} Filtres vides
   */
  resetFilters() {
    return {
      name: '',
      categoryId: '',
      priceMin: null,
      priceMax: null
    }
  }
}
