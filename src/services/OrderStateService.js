/**
 * 🎯 OrderStateService.js
 * Gestion des états de commandes
 * 
 * États supportés:
 * 1. "dans le panier" (Cart only)
 * 2. "paiement effectué" (Order paid)
 * 3. "annulé" (Cancelled)
 * 
 * Mappings supplémentaires pour les valeurs du CSV:
 * - "en attente paiement à la livraison" → "dans le panier"
 * - "paiement accepté" → "paiement effectué"
 * - "erreur de paiement" → "annulé"
 */

const ORDER_STATES = {
  CART: 1,              // "dans le panier" - Cart seulement
  PAID: 2,              // "paiement effectué" - Commande validée
  CANCELLED: 3          // "annulé" - Commande annulée
}

const STATE_LABELS = {
  [ORDER_STATES.CART]: 'Dans le panier',
  [ORDER_STATES.PAID]: 'Paiement effectué',
  [ORDER_STATES.CANCELLED]: 'Annulé'
}

// Mapping des valeurs d'input utilisateur vers IDs
// Supporte les valeurs françaises et anglaises
const INPUT_MAPPING = {
  // === État CART (dans le panier) ===
  'dans le panier': ORDER_STATES.CART,
  'cart': ORDER_STATES.CART,
  'panier': ORDER_STATES.CART,
  'pending': ORDER_STATES.CART,
  // Valeurs du CSV
  'en attente paiement à la livraison': ORDER_STATES.CART,
  'attente paiement livraison': ORDER_STATES.CART,
  'en attente de paiement': ORDER_STATES.CART,
  'waiting delivery': ORDER_STATES.CART,
  'waiting': ORDER_STATES.CART,
  
  // === État PAID (paiement effectué) ===
  'paiement effectué': ORDER_STATES.PAID,
  'paid': ORDER_STATES.PAID,
  'paiement': ORDER_STATES.PAID,
  'validated': ORDER_STATES.PAID,
  'confirmé': ORDER_STATES.PAID,
  'confirmé': ORDER_STATES.PAID,
  // Valeurs du CSV
  'paiement accepté': ORDER_STATES.PAID,
  'accepté': ORDER_STATES.PAID,
  'payé': ORDER_STATES.PAID,
  'validé': ORDER_STATES.PAID,
  
  // === État CANCELLED (annulé) ===
  'annulé': ORDER_STATES.CANCELLED,
  'canceled': ORDER_STATES.CANCELLED,
  'cancelled': ORDER_STATES.CANCELLED,
  'cancel': ORDER_STATES.CANCELLED,
  // Valeurs du CSV
  'erreur de paiement': ORDER_STATES.CANCELLED,
  'error': ORDER_STATES.CANCELLED,
  'refusé': ORDER_STATES.CANCELLED,
  'refused': ORDER_STATES.CANCELLED
}

// Mapping vers IDs PrestaShop
const PRESTASHOP_STATE_MAPPING = {
  [ORDER_STATES.CART]: 1,           // Cart en attente
  [ORDER_STATES.PAID]: 2,           // Commande payée
  [ORDER_STATES.CANCELLED]: 6       // Commande annulée
}

export const OrderStateService = {
  /**
   * Obtenir le label d'un état
   * @param {number} stateId - ID de l'état (1, 2 ou 3)
   * @returns {string} Label français
   */
  getStateLabel(stateId) {
    return STATE_LABELS[stateId] || 'État inconnu'
  },

  /**
   * Vérifier si un état est valide
   * @param {number} stateId - ID à vérifier
   * @returns {boolean}
   */
  isValidState(stateId) {
    return [ORDER_STATES.CART, ORDER_STATES.PAID, ORDER_STATES.CANCELLED].includes(stateId)
  },

  /**
   * Mapper une valeur d'input utilisateur vers ID d'état
   * @param {string|number} input - Valeur d'input (ex: "paiement effectué", "paid", "en attente paiement à la livraison", etc)
   * @returns {number|null} ID d'état ou null si non trouvé
   */
  mapFromInput(input) {
    if (!input) return null
    
    const normalized = String(input).trim().toLowerCase()
    const mapped = INPUT_MAPPING[normalized]
    
    if (mapped !== undefined) {
      console.log(`  ✓ État mappé: "${input}" → ${mapped} (${this.getStateLabel(mapped)})`)
      return mapped
    }
    
    // Tentative de mapping par similarité (fallback)
    const similarMatch = this._findSimilarState(normalized)
    if (similarMatch) {
      console.log(`  🔧 État approximatif: "${input}" → ${similarMatch} (${this.getStateLabel(similarMatch)})`)
      return similarMatch
    }
    
    console.warn(`  ⚠️ État non reconnu: "${input}", utilisation de "dans le panier" par défaut`)
    return ORDER_STATES.CART // Valeur par défaut
  },

  /**
   * Trouver un état similaire par mots-clés
   * @param {string} input - Texte normalisé
   * @returns {number|null} ID de l'état ou null
   * @private
   */
  _findSimilarState(input) {
    // Mots-clés pour chaque état
    const keywords = {
      [ORDER_STATES.CART]: ['attente', 'panier', 'waiting', 'cart', 'livraison', 'delivery'],
      [ORDER_STATES.PAID]: ['paiement', 'payé', 'validé', 'accepté', 'paid', 'validated'],
      [ORDER_STATES.CANCELLED]: ['annul', 'cancel', 'erreur', 'error', 'refus']
    }
    
    for (const [stateId, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (input.includes(word)) {
          return parseInt(stateId)
        }
      }
    }
    
    return null
  },

  /**
   * Obtenir l'ID PrestaShop correspondant
   * @param {number} stateId - ID interne (1, 2, 3)
   * @returns {number} ID PrestaShop
   */
  getPrestashopStateId(stateId) {
    return PRESTASHOP_STATE_MAPPING[stateId] || 1
  },

  /**
   * Obtenir tous les états disponibles
   * @returns {array} Liste des états
   */
  getAllStates() {
    return [
      { id: ORDER_STATES.CART, label: STATE_LABELS[ORDER_STATES.CART] },
      { id: ORDER_STATES.PAID, label: STATE_LABELS[ORDER_STATES.PAID] },
      { id: ORDER_STATES.CANCELLED, label: STATE_LABELS[ORDER_STATES.CANCELLED] }
    ]
  },

  /**
   * Générer XML PrestaShop pour mettre à jour statut commande
   * @param {number} orderId - ID de la commande
   * @param {number} stateId - ID de l'état interne
   * @returns {string} XML pour API
   */
  generateOrderStateXml(orderId, stateId) {
    const prestashopStateId = this.getPrestashopStateId(stateId)
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <order>
    <id>${orderId}</id>
    <current_state>${prestashopStateId}</current_state>
  </order>
</prestashop>`
  },

  /**
   * Valider un objet commande
   * @param {object} order - Objet commande à valider
   * @returns {object} {valid: boolean, errors: []}
   */
  validateOrder(order) {
    const errors = []
    
    if (!order.state_id || !this.isValidState(order.state_id)) {
      errors.push(`État invalide: ${order.state_id}`)
    }
    
    if (order.total && isNaN(parseFloat(order.total))) {
      errors.push(`Montant invalide: ${order.total}`)
    }
    
    if (order.date && isNaN(new Date(order.date).getTime())) {
      errors.push(`Date invalide: ${order.date}`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  /**
   * Obtenir la description détaillée d'un état
   * @param {number} stateId - ID de l'état
   * @returns {object} Description de l'état
   */
  getStateDescription(stateId) {
    const descriptions = {
      [ORDER_STATES.CART]: {
        label: 'Dans le panier',
        icon: '🛒',
        description: 'Panier en attente de confirmation',
        canTransitionTo: [ORDER_STATES.PAID, ORDER_STATES.CANCELLED],
        action: 'Créer un CART (pas de commande)'
      },
      [ORDER_STATES.PAID]: {
        label: 'Paiement effectué',
        icon: '✅',
        description: 'Commande validée et payée',
        canTransitionTo: [ORDER_STATES.CANCELLED],
        action: 'Créer une ORDER avec statut PAID'
      },
      [ORDER_STATES.CANCELLED]: {
        label: 'Annulé',
        icon: '❌',
        description: 'Commande annulée',
        canTransitionTo: [],
        action: 'Créer une ORDER avec statut CANCELLED'
      }
    }
    
    return descriptions[stateId] || null
  },

  /**
   * Normaliser une valeur d'état depuis le CSV
   * @param {string} csvState - Valeur brute du CSV
   * @returns {number} ID d'état normalisé
   */
  normalizeFromCSV(csvState) {
    if (!csvState) return ORDER_STATES.CART
    
    const normalized = csvState.toLowerCase().trim()
    
    // Mapping spécifique pour les valeurs du CSV client.csv
    if (normalized.includes('attente') && normalized.includes('livraison')) {
      return ORDER_STATES.CART
    }
    if (normalized.includes('accepté') || normalized.includes('effectué')) {
      return ORDER_STATES.PAID
    }
    if (normalized.includes('erreur')) {
      return ORDER_STATES.CANCELLED
    }
    
    return this.mapFromInput(csvState) || ORDER_STATES.CART
  },

  /**
   * Constants export (pour accès direct)
   */
  STATES: ORDER_STATES,
  LABELS: STATE_LABELS
}