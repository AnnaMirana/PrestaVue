/**
 * 🎯 SessionService.js
 * Gestion de la session utilisateur + panier
 * 
 * Stockage:
 * - localStorage: session persistante
 * - sessionStorage: données temporaires
 */

const STORAGE_KEY_SESSION = 'newapp_session'
const STORAGE_KEY_CART = 'newapp_cart'

const DEFAULT_SESSION = {
  user: {
    id: null,
    name: 'Anonyme',
    email: null,
    isAnonymous: true
  },
  cart: {
    items: [],
    total: 0
  },
  isLoggedIn: false,
  loginTime: null
}

export const SessionService = {
  /**
   * Initialiser la session
   */
  init() {
    console.log('🔄 Initialisation SessionService...')
    
    // Charger depuis localStorage
    const stored = this.getStoredSession()
    if (!stored) {
      this.setSession(DEFAULT_SESSION)
      console.log('✓ Session par défaut créée')
    } else {
      console.log('✓ Session restaurée:', stored.user.name)
    }
  },

  /**
   * Récupérer la session actuelle
   * @returns {object} Session complète
   */
  getSession() {
    return this.getStoredSession() || DEFAULT_SESSION
  },

  /**
   * Récupérer session depuis localStorage
   * @returns {object|null}
   */
  getStoredSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION)
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      console.error('Erreur lecture session:', e)
      return null
    }
  },

  /**
   * Sauvegarder la session
   * @param {object} session - Session à sauvegarder
   */
  setSession(session) {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session))
      console.log('✓ Session sauvegardée')
    } catch (e) {
      console.error('Erreur sauvegarde session:', e)
    }
  },

  /**
   * Connecter un utilisateur
   * @param {object} user - Données utilisateur {id, name, email}
   */
  loginUser(user) {
    if (!user || !user.id) {
      throw new Error('Utilisateur invalide')
    }

    const session = {
      ...this.getSession(),
      user: {
        id: user.id,
        name: user.name || 'Utilisateur',
        email: user.email || null,
        isAnonymous: false
      },
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    }

    this.setSession(session)
    console.log(`✓ Utilisateur connecté: ${user.name} (ID: ${user.id})`)
  },

  /**
   * Connecter un utilisateur anonyme
   */
  loginAnonymous() {
    const session = {
      ...this.getSession(),
      user: {
        id: null,
        name: 'Anonyme',
        email: null,
        isAnonymous: true
      },
      isLoggedIn: false,
      loginTime: new Date().toISOString()
    }

    this.setSession(session)
    console.log('✓ Session anonyme créée')
  },

  /**
   * Déconnecter l'utilisateur
   */
  logout() {
    this.setSession(DEFAULT_SESSION)
    console.log('✓ Session fermée')
  },

  /**
   * Obtenir l'utilisateur actuel
   * @returns {object} Objet utilisateur
   */
  getCurrentUser() {
    return this.getSession().user
  },

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.getSession().isLoggedIn === true
  },

  /**
   * Vérifier si l'utilisateur est anonyme
   * @returns {boolean}
   */
  isAnonymous() {
    return this.getCurrentUser().isAnonymous === true
  },

  /**
   * Récupérer l'ID utilisateur actuel
   * @returns {number|null}
   */
  getUserId() {
    return this.getCurrentUser().id
  },

  /**
   * Gestion du panier
   */
  // Récupérer le panier
  getCart() {
    return this.getSession().cart
  },

  // Ajouter article au panier
  addToCart(product, quantity = 1) {
    if (!product || !product.id) {
      throw new Error('Produit invalide')
    }

    const session = this.getSession()
    const existingItem = session.cart.items.find(item => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      session.cart.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity
      })
    }

    this.updateCartTotal(session)
    this.setSession(session)
    console.log(`✓ ${product.name} ajouté au panier (qty: ${quantity})`)
  },

  // Supprimer article du panier
  removeFromCart(productId) {
    const session = this.getSession()
    session.cart.items = session.cart.items.filter(item => item.id !== productId)
    this.updateCartTotal(session)
    this.setSession(session)
    console.log(`✓ Article supprimé du panier`)
  },

  // Vider le panier
  clearCart() {
    const session = this.getSession()
    session.cart = { items: [], total: 0 }
    this.setSession(session)
    console.log('✓ Panier vidé')
  },

  // Mettre à jour le total du panier
  updateCartTotal(session = null) {
    if (!session) session = this.getSession()
    
    session.cart.total = session.cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)

    return session.cart.total
  },

  // Obtenir le nombre d'articles dans le panier
  getCartItemCount() {
    return this.getCart().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  // Obtenir le total du panier
  getCartTotal() {
    return this.getCart().total
  },

  /**
   * Résumer l'état de la session (pour debug)
   * @returns {string} Résumé lisible
   */
  summary() {
    const session = this.getSession()
    return `
    👤 Utilisateur: ${session.user.name}
    🔐 Connecté: ${session.isLoggedIn ? 'Oui' : 'Non'}
    🛒 Panier: ${session.cart.items.length} article(s)
    💰 Total: ${session.cart.total.toFixed(2)}€
    `
  },

  /**
   * État de la session (pour bindings Vue)
   */
  getReactiveSession() {
    // Utiliser si besoin réactivité Vue
    return this.getSession()
  }
}

// Initialiser au chargement
SessionService.init()
