<template>
  <div class="frontoffice-container">
    <header class="frontoffice-header">
      <h1>🛍️ PrestaVue Shop</h1>
      <div class="header-actions">
        <button @click="handleViewCart" class="btn-cart">
          🛒 Panier ({{ cart.length }})
        </button>
        <button @click="handleLogout" class="btn-logout-shop">Déconnexion</button>
      </div>
    </header>

    <main class="frontoffice-main">
      <!-- Vue Produits -->
      <div v-if="currentView === 'products'" class="products-section">
        <h2>Catalogue produits</h2>
        <p class="subtitle">Sélectionnez les produits que vous souhaitez acheter</p>

        <!-- Barre de recherche et filtres -->
        <div class="search-bar">
          <div class="search-form">
            <div class="search-field">
              <label for="search-name">🔍 Nom du produit</label>
              <input
                id="search-name"
                v-model="searchFilters.name"
                type="text"
                placeholder="Chercher un produit..."
                class="search-input"
                @input="applySearchFilters"
              />
            </div>
            
            <div class="search-field">
              <label for="price-min">💰 Prix min (€)</label>
              <input
                id="price-min"
                v-model="searchFilters.priceMin"
                type="number"
                placeholder="0"
                class="search-input"
                @input="applySearchFilters"
              />
            </div>
            
            <div class="search-field">
              <label for="price-max">💰 Prix max (€)</label>
              <input
                id="price-max"
                v-model="searchFilters.priceMax"
                type="number"
                placeholder="10000"
                class="search-input"
                @input="applySearchFilters"
              />
            </div>
            
            <button @click="resetSearchFilters" class="btn-reset-search">
              ↻ Réinitialiser
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading">Chargement des produits...</div>

        <div v-else class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <!-- Badge HOT/NEW -->
            <div v-if="product.badge" class="product-badge" :class="{ hot: product.badge === 'HOT', new: product.badge === 'NEW' }">
              {{ product.badge }}
            </div>
            
            <div class="product-header">
              <h3>{{ product.name }}</h3>
              <span class="product-price">{{ product.price }}€</span>
            </div>
            <div class="product-body">
              <p class="reference">Réf: {{ product.reference }}</p>
              
              <!-- Affichage du stock disponible -->
              <div class="stock-info" :class="{ 'stock-low': product.stock < 5 }">
                <span class="stock-label">📦 En stock:</span>
                <span class="stock-quantity">{{ product.stock }} unité(s)</span>
              </div>
              
              <input
                v-model.number="product.selectedQuantity"
                type="number"
                min="0"
                :max="product.stock"
                placeholder="Quantité"
                class="input-quantity"
              />
            </div>
            <button
              @click="addToCart(product)"
              :disabled="!product.selectedQuantity || product.selectedQuantity <= 0 || product.stock <= 0"
              class="btn-add-cart"
              :title="product.stock <= 0 ? 'Produit indisponible' : ''"
            >
              {{ product.stock > 0 ? 'Ajouter au panier' : 'Indisponible' }}
            </button>
          </div>
        </div>

        <div v-if="!loading && products.length === 0" class="empty-state">
          <p>Aucun produit disponible.</p>
          <p class="hint" v-if="allProducts.length > 0">Aucun produit ne correspond à vos critères de recherche.</p>
          <p class="hint" v-else>Importez d'abord les produits via le backoffice.</p>
        </div>
      </div>

      <!-- Vue Panier -->
      <div v-if="currentView === 'cart'" class="cart-section">
        <h2>Votre panier</h2>

        <div v-if="cart.length === 0" class="empty-cart">
          <p>Votre panier est vide.</p>
          <button @click="currentView = 'products'" class="btn-continue-shopping">
            Continuer vos achats
          </button>
        </div>

        <div v-else>
          <table class="cart-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix unitaire</th>
                <th>Quantité</th>
                <th>Sous-total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in cart" :key="index">
                <td>{{ item.name }} ({{ item.reference }})</td>
                <td>{{ item.price }}€</td>
                <td>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    max="100"
                    class="input-qty-small"
                  />
                </td>
                <td class="subtotal">{{ (item.price * item.quantity).toFixed(2) }}€</td>
                <td>
                  <button @click="removeFromCart(index)" class="btn-remove">
                    Supprimer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="cart-summary">
            <div class="summary-row">
              <span>Sous-total:</span>
              <strong>{{ subtotal.toFixed(2) }}€</strong>
            </div>
            <div class="summary-row">
              <span>Frais de port:</span>
              <strong>Gratuit</strong>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <strong>{{ total.toFixed(2) }}€</strong>
            </div>
          </div>

          <div class="cart-actions">
            <button @click="currentView = 'products'" class="btn-continue">
              Continuer vos achats
            </button>
            <button @click="currentView = 'checkout'" class="btn-checkout">
              Passer la commande
            </button>
          </div>
        </div>
      </div>

      <!-- Vue Checkout -->
      <div v-if="currentView === 'checkout'" class="checkout-section">
        <h2>Finaliser votre commande</h2>

        <div class="checkout-container">
          <!-- Informations de livraison -->
          <div class="checkout-card">
            <h3>📍 Adresse de livraison</h3>
            <div class="address-info">
              <p><strong>{{ customerInfo.firstname }} {{ customerInfo.lastname }}</strong></p>
              <p>{{ customerInfo.address }}</p>
              <p>{{ customerInfo.postcode }} {{ customerInfo.city }}</p>
            </div>
          </div>

          <!-- Détails de la commande -->
          <div class="checkout-card">
            <h3>📦 Résumé de la commande</h3>
            <table class="summary-table">
              <tr v-for="(item, index) in cart" :key="index">
                <td>{{ item.name }}</td>
                <td>{{ item.quantity }}x</td>
                <td class="price">{{ (item.price * item.quantity).toFixed(2) }}€</td>
              </tr>
              <tr class="total-row">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td class="price"><strong>{{ total.toFixed(2) }}€</strong></td>
              </tr>
            </table>
          </div>

          <!-- Mode de paiement -->
          <div class="checkout-card payment-section">
            <h3>💳 Mode de paiement</h3>
            <div class="payment-option selected">
              <input
                type="radio"
                id="payment-delivery"
                name="payment"
                value="delivery"
                checked
                @change="paymentMethod = 'delivery'"
              />
              <label for="payment-delivery">
                <strong>Paiement à la livraison</strong>
                <p class="payment-desc">Payez directement au livreur à la réception de votre colis</p>
              </label>
            </div>
          </div>

          <!-- Conditions d'utilisation -->
          <div class="checkout-card">
            <label class="checkbox">
              <input v-model="acceptedTerms" type="checkbox" />
              <span>J'accepte les conditions d'utilisation et la politique de confidentialité</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="checkout-actions">
            <button @click="currentView = 'cart'" class="btn-back">
              ← Retour au panier
            </button>
            <button
              @click="handlePlaceOrder"
              :disabled="!acceptedTerms || orderLoading"
              class="btn-place-order"
            >
              <span v-if="!orderLoading">✓ Passer la commande</span>
              <span v-else>Traitement...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Vue Confirmation -->
      <div v-if="currentView === 'confirmation'" class="confirmation-section">
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h2>Commande confirmée!</h2>
          <p class="order-ref">N° de commande: <strong>{{ orderConfirmation.orderRef }}</strong></p>
          <p class="order-total">Total: <strong>{{ orderConfirmation.total }}€</strong></p>

          <div class="confirmation-details">
            <p>
              Nous vous remercions de votre achat!
            </p>
            <p>
              Un email de confirmation a été envoyé à <strong>{{ customerInfo.email }}</strong>
            </p>
            <p class="payment-info">
              Vous payerez <strong>{{ orderConfirmation.total }}€</strong> lors de la livraison.
            </p>
          </div>

          <button @click="handleNewShopping" class="btn-continue-shopping-large">
            Continuer vos achats
          </button>
        </div>
      </div>
    </main>

    <!-- Message d'erreur -->
    <div v-if="errorMessage" class="error-box">
      <p>⚠️ {{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="btn-close-error">Fermer</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ApiService } from '../services/ApiService.js'
import { OrderService } from '../services/OrderService.js'
import { AuthService } from '../services/AuthService.js'
import { StockService } from '../services/StockService.js'

const router = useRouter()

// État
const currentView = ref('products')
const products = ref([])
const allProducts = ref([])
const cart = ref([])
const loading = ref(false)
const orderLoading = ref(false)
const errorMessage = ref('')
const paymentMethod = ref('delivery')
const acceptedTerms = ref(false)

// Filtres de recherche
const searchFilters = ref({
  name: '',
  priceMin: '',
  priceMax: '',
})

// Info client - RÉCUPÉRÉE DEPUIS AUTHSERVICE
const customerInfo = ref({
  firstname: '',
  lastname: '',
  email: '',
  address: '',
  postcode: '',
  city: '',
  idCustomer: null,
  idAddress: null,
})

// Confirmation de commande
const orderConfirmation = ref({
  orderRef: '',
  total: 0,
})

// Calcul du total
const subtotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + item.price * item.quantity, 0)
})

const total = computed(() => subtotal.value)

// Calculer le badge HOT/NEW basé sur la date de disponibilité
const calculateProductBadge = (dateStr) => {
  if (!dateStr) return null
  
  try {
    // Convertir DD/MM/YYYY en Date
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    
    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    const today = new Date()
    const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    if (date > oneDayAgo) {
      return 'HOT' // Lancé il y a moins de 1 jour
    } else if (date > oneWeekAgo) {
      return 'NEW' // Lancé il y a moins de 1 semaine
    }
  } catch (error) {
    console.warn('Erreur parsing date:', dateStr)
  }
  
  return null
}

// Filtrer les produits selon les critères de recherche
const applySearchFilters = () => {
  const filters = searchFilters.value
  let filtered = [...allProducts.value]
  
  // Filtre par nom
  if (filters.name && filters.name.trim()) {
    const searchTerm = filters.name.toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm))
  }
  
  // Filtre par prix minimum
  if (filters.priceMin) {
    const minPrice = parseFloat(filters.priceMin)
    filtered = filtered.filter(p => p.price >= minPrice)
  }
  
  // Filtre par prix maximum
  if (filters.priceMax) {
    const maxPrice = parseFloat(filters.priceMax)
    filtered = filtered.filter(p => p.price <= maxPrice)
  }
  
  products.value = filtered
}

// Réinitialiser les filtres
const resetSearchFilters = () => {
  searchFilters.value = {
    name: '',
    priceMin: '',
    priceMax: '',
  }
  products.value = [...allProducts.value]
}

// Initialisation
onMounted(async () => {
  // Vérifier que le client est connecté
  const customerId = AuthService.getCustomerId()
  
  if (!customerId) {
    // Pas connecté, rediriger vers login
    router.push('/shop-login')
    return
  }

  // Récupérer les infos du client stockées
  const customerEmail = AuthService.getCustomerEmail()
  
  if (customerEmail) {
    // Charger les infos complètes du client depuis PrestaShop
    const { CustomerService } = await import('../services/CustomerService.js')
    const customer = await CustomerService.getCustomer(customerId)
    
    if (customer) {
      customerInfo.value = {
        firstname: customer.firstname,
        lastname: customer.lastname,
        email: customer.email,
        address: customer.address.address1 || 'Non spécifiée',
        postcode: customer.address.postcode || '75000',
        city: customer.address.city || 'Paris',
        idCustomer: customer.id,
        idAddress: customer.address.id || customer.id,
      }
    }
  }

  await fetchProducts()
})

// Récupère les produits depuis PrestaShop
const fetchProducts = async () => {
  loading.value = true
  try {
    // Initialiser le service de stock
    StockService.initDB()

    const xml = await ApiService.get('products')
    if (!xml) {
      errorMessage.value = 'Impossible de récupérer les produits'
      return
    }

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, 'text/xml')
    const productElements = xmlDoc.getElementsByTagName('product')

    products.value = []
    for (let i = 0; i < productElements.length; i++) {
      const productEl = productElements[i]
      const id = productEl.getElementsByTagName('id')[0]?.textContent || ''
      const name = productEl.getElementsByTagName('name')[0]?.getElementsByTagName('language')[0]?.textContent || 'Produit sans nom'
      const price = parseFloat(productEl.getElementsByTagName('price')[0]?.textContent || '0')
      const reference = productEl.getElementsByTagName('reference')[0]?.textContent || ''
      const dateAvailability = productEl.getElementsByTagName('date_availability')[0]?.textContent || ''
      
      // Charger le stock depuis StockService
      const stock = StockService.getStock(reference)

      // Calculer le badge HOT/NEW
      const badge = calculateProductBadge(dateAvailability)

      products.value.push({
        id,
        name,
        price,
        reference,
        stock, // ✅ Quantité en stock disponible
        dateAvailability,
        badge, // ✅ Badge HOT ou NEW
        selectedQuantity: 0,
      })
    }
    
    allProducts.value = [...products.value]
  } catch (error) {
    console.error('Erreur récupération produits:', error)
    errorMessage.value = 'Erreur lors du chargement des produits'
  } finally {
    loading.value = false
  }
}

// Ajoute un produit au panier
const addToCart = (product) => {
  // ✅ Vérifier que la quantité n'excède pas le stock
  if (product.selectedQuantity > product.stock) {
    errorMessage.value = `Quantité maximale disponible: ${product.stock} unité(s)`
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  const existingItem = cart.value.find(item => item.id === product.id)

  if (existingItem) {
    // ✅ Vérifier aussi pour les articles déjà dans le panier
    const totalQuantity = existingItem.quantity + product.selectedQuantity
    if (totalQuantity > product.stock) {
      errorMessage.value = `Quantité totale maximale: ${product.stock} unité(s) (${existingItem.quantity} déjà dans le panier)`
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
      return
    }
    existingItem.quantity += product.selectedQuantity
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      reference: product.reference,
      quantity: product.selectedQuantity,
    })
  }

  product.selectedQuantity = 0
  errorMessage.value = `${product.name} ajouté au panier!`
  setTimeout(() => {
    errorMessage.value = ''
  }, 2000)
}

// Supprime un produit du panier
const removeFromCart = (index) => {
  cart.value.splice(index, 1)
}

// Affiche le panier
const handleViewCart = () => {
  currentView.value = 'cart'
}

// Passe la commande
const handlePlaceOrder = async () => {
  if (!acceptedTerms.value) {
    errorMessage.value = 'Vous devez accepter les conditions'
    return
  }

  if (cart.value.length === 0) {
    errorMessage.value = 'Votre panier est vide'
    return
  }

  orderLoading.value = true

  try {
    // Créer le panier dans PrestaShop
    const cartXml = `
      <prestashop>
        <cart>
          <id_customer>${customerInfo.value.idCustomer}</id_customer>
          <id_address_delivery>${customerInfo.value.idAddress}</id_address_delivery>
          <id_address_invoice>${customerInfo.value.idAddress}</id_address_invoice>
          <id_currency>1</id_currency>
        </cart>
      </prestashop>`

    const cartRes = await ApiService.post('carts', cartXml)
    if (!cartRes.ok) {
      throw new Error('Erreur création panier')
    }

    const parser = new DOMParser()
    const cartXmlDoc = parser.parseFromString(cartRes.text, 'text/xml')
    const cartId = cartXmlDoc.getElementsByTagName('id')[0]?.textContent

    if (!cartId) {
      throw new Error('ID panier introuvable')
    }

    // Ajouter les items au panier
    for (const item of cart.value) {
      const itemXml = `
        <prestashop>
          <cart_row>
            <id_product_attribute>0</id_product_attribute>
            <id_product>${item.id}</id_product>
            <quantity>${item.quantity}</quantity>
          </cart_row>
        </prestashop>`

      await ApiService.post(`carts/${cartId}`, itemXml)
    }

    // Créer la commande avec paiement à la livraison
    const orderRes = await OrderService.createOrderFromCart({
      cartId,
      customerId: customerInfo.value.idCustomer,
      addressDeliveryId: customerInfo.value.idAddress,
      addressInvoiceId: customerInfo.value.idAddress,
    })

    if (orderRes.success) {
      orderConfirmation.value = {
        orderRef: `ORD-${Date.now()}`,
        total: total.value,
      }

      cart.value = []
      acceptedTerms.value = false
      currentView.value = 'confirmation'
    } else {
      errorMessage.value = orderRes.message || 'Erreur lors de la création de la commande'
    }
  } catch (error) {
    console.error('Erreur placement commande:', error)
    errorMessage.value = 'Erreur lors de la création de la commande'
  } finally {
    orderLoading.value = false
  }
}

// Nouveau shopping
const handleNewShopping = () => {
  currentView.value = 'products'
}

// Déconnexion
const handleLogout = () => {
  AuthService.logout()
  router.push('/login')
}
</script>

<style scoped>
.frontoffice-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: 'Segoe UI', sans-serif;
}

.frontoffice-header {
  background-color: #1a2a6c;
  color: white;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.frontoffice-header h1 {
  margin: 0;
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.btn-cart,
.btn-logout-shop {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: 0.3s;
}

.btn-cart {
  background-color: #27ae60;
  color: white;
}

.btn-cart:hover {
  background-color: #229954;
}

.btn-logout-shop {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.btn-logout-shop:hover {
  background-color: rgba(231, 76, 60, 0.3);
}

.frontoffice-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* === SECTION PRODUITS === */
.products-section h2,
.cart-section h2,
.checkout-section h2 {
  color: #1a2a6c;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 30px;
}

/* === BARRE DE RECHERCHE === */
.search-bar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  align-items: flex-end;
}

.search-field {
  display: flex;
  flex-direction: column;
}

.search-field label {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.search-input {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.btn-reset-search {
  padding: 10px 16px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-reset-search:hover {
  background-color: #c0392b;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

/* === BADGES HOT/NEW === */
.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  z-index: 10;
}

.product-badge.hot {
  background-color: #e74c3c;
  color: white;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.3);
}

.product-badge.new {
  background-color: #3498db;
  color: white;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0,0,0,0.1);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 15px;
}

.product-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  flex: 1;
}

.product-price {
  font-size: 18px;
  font-weight: bold;
  color: #27ae60;
  white-space: nowrap;
  margin-left: 10px;
}

.reference {
  font-size: 12px;
  color: #95a5a6;
  margin: 10px 0;
}

/* === STOCK DISPLAY === */
.stock-info {
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.stock-info.stock-low {
  background-color: #fff3e0;
  border-color: #ffe0b2;
}

.stock-label {
  font-weight: 600;
  color: #2e7d32;
}

.stock-info.stock-low .stock-label {
  color: #e65100;
}

.stock-quantity {
  font-weight: bold;
  color: #2e7d32;
}

.stock-info.stock-low .stock-quantity {
  color: #e65100;
}

.input-quantity {
  width: 100%;
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  margin: 10px 0;
}

.btn-add-cart {
  width: 100%;
  padding: 10px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
}

.btn-add-cart:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-add-cart:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.hint {
  font-size: 12px;
  color: #95a5a6;
}

/* === SECTION PANIER === */
.empty-cart {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  color: #7f8c8d;
}

.btn-continue-shopping {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-continue-shopping:hover {
  background-color: #2980b9;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  margin: 20px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.cart-table th {
  background-color: #1a2a6c;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

.cart-table td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.cart-table tr:last-child td {
  border-bottom: none;
}

.input-qty-small {
  width: 70px;
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  text-align: center;
}

.subtotal {
  font-weight: 600;
  color: #27ae60;
}

.btn-remove {
  padding: 6px 12px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-remove:hover {
  background-color: #c0392b;
}

.cart-summary {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  max-width: 400px;
  margin-left: auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
}

.summary-row.total {
  border-bottom: none;
  border-top: 2px solid #1a2a6c;
  padding-top: 15px;
  font-size: 18px;
  color: #1a2a6c;
}

.cart-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: flex-end;
}

.btn-continue,
.btn-checkout {
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
}

.btn-continue {
  background-color: #95a5a6;
  color: white;
}

.btn-continue:hover {
  background-color: #7f8c8d;
}

.btn-checkout {
  background-color: #27ae60;
  color: white;
}

.btn-checkout:hover {
  background-color: #229954;
}

/* === SECTION CHECKOUT === */
.checkout-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin: 30px 0;
}

.checkout-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.checkout-card h3 {
  color: #1a2a6c;
  margin-top: 0;
  margin-bottom: 15px;
}

.address-info p {
  margin: 8px 0;
  color: #2c3e50;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table tr {
  border-bottom: 1px solid #ecf0f1;
  padding: 10px 0;
}

.summary-table td {
  padding: 10px;
}

.summary-table .price {
  text-align: right;
  font-weight: 600;
  color: #27ae60;
}

.total-row {
  border-top: 2px solid #1a2a6c;
  font-size: 16px;
}

.payment-section {
  padding-bottom: 30px;
}

.payment-option {
  border: 2px solid #bdc3c7;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  gap: 15px;
}

.payment-option.selected {
  border-color: #27ae60;
  background-color: rgba(39, 174, 96, 0.05);
}

.payment-option input {
  cursor: pointer;
  margin-top: 5px;
}

.payment-option label {
  cursor: pointer;
  flex: 1;
}

.payment-option label strong {
  color: #1a2a6c;
}

.payment-desc {
  font-size: 12px;
  color: #7f8c8d;
  margin: 5px 0 0 0;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #2c3e50;
}

.checkbox input {
  cursor: pointer;
}

.checkout-actions {
  display: flex;
  gap: 15px;
  justify-content: space-between;
  margin-top: 30px;
}

.btn-back,
.btn-place-order {
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
  flex: 1;
  text-align: center;
}

.btn-back {
  background-color: #95a5a6;
  color: white;
}

.btn-back:hover {
  background-color: #7f8c8d;
}

.btn-place-order {
  background-color: #27ae60;
  color: white;
}

.btn-place-order:hover:not(:disabled) {
  background-color: #229954;
}

.btn-place-order:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* === SECTION CONFIRMATION === */
.confirmation-section {
  max-width: 600px;
  margin: 0 auto;
}

.success-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.success-icon {
  font-size: 64px;
  color: #27ae60;
  margin-bottom: 20px;
}

.success-box h2 {
  color: #1a2a6c;
  margin: 20px 0;
}

.order-ref,
.order-total {
  font-size: 16px;
  color: #2c3e50;
  margin: 10px 0;
}

.confirmation-details {
  background-color: #ecf0f1;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  color: #2c3e50;
  text-align: left;
}

.confirmation-details p {
  margin: 10px 0;
}

.payment-info {
  background-color: rgba(39, 174, 96, 0.1);
  border-left: 4px solid #27ae60;
  padding: 10px;
}

.btn-continue-shopping-large {
  margin-top: 20px;
  padding: 12px 30px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
}

.btn-continue-shopping-large:hover {
  background-color: #2980b9;
}

/* === MESSAGES D'ERREUR === */
.error-box {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #e74c3c;
  color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  max-width: 400px;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.error-box p {
  margin: 0;
}

.btn-close-error {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-close-error:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
