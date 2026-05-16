<template>
  <div class="shop-login-container">
    <div class="shop-login-card">
      <div class="login-header">
        <h1>🛍️ PrestaVue Shop</h1>
        <p>Connexion client</p>
      </div>

      <!-- Sélection d'utilisateur existant -->
      <div v-if="!isLoggedIn && showUserList" class="user-list-section">
        <h3>Sélectionnez votre compte</h3>
        <div class="users-grid">
          <button 
            v-for="customer in existingCustomers" 
            :key="customer.id" 
            @click="quickLogin(customer)"
            class="user-card"
          >
            <div class="user-icon">👤</div>
            <div class="user-name">{{ customer.firstname }} {{ customer.lastname }}</div>
            <div class="user-email">{{ customer.email }}</div>
          </button>
          
          <button @click="handleContinueAsGuest" class="user-card guest">
            <div class="user-icon">🕶️</div>
            <div class="user-name">Utilisateur anonyme</div>
            <div class="user-email">Sans connexion</div>
          </button>
        </div>

        <div class="login-toggle">
          <button type="button" @click="showUserList = false" class="btn-switch-form">
            ✏️ Connexion manuelle
          </button>
        </div>
      </div>

      <!-- Formulaire de connexion -->
      <form v-if="!isLoggedIn && !showUserList" @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="votre@email.com"
            class="input-field"
            :disabled="isLoading"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Entrez votre mot de passe"
            class="input-field"
            :disabled="isLoading"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          <span v-if="!isLoading">Se connecter</span>
          <span v-else>Connexion en cours...</span>
        </button>

        <div class="login-alternatives">
          <button type="button" @click="handleContinueAsGuest" class="btn-guest">
            Continuer en tant qu'invité
          </button>
        </div>

        <div class="login-toggle">
          <button type="button" @click="showUserList = true" class="btn-switch-form">
            ← Retour à la sélection
          </button>
        </div>
      </form>

      <!-- Affichage une fois connecté -->
      <div v-else class="login-success">
        <div class="success-icon">✓</div>
        <h2>Bienvenue, {{ currentCustomer.firstname }}!</h2>
        <div class="customer-info">
          <p><strong>Email:</strong> {{ currentCustomer.email }}</p>
          <p><strong>Adresse:</strong> {{ currentCustomer.address.address1 || 'Non configurée' }}</p>
          <p v-if="currentCustomer.address.city" class="address-city">
            {{ currentCustomer.address.postcode }} {{ currentCustomer.address.city }}
          </p>
        </div>

        <button @click="handleContinueShopping" class="btn-continue-large">
          🛍️ Continuer les achats
        </button>

        <button @click="handleLogout" class="btn-logout-shop">
          Changer de compte
        </button>
      </div>

      <div class="demo-hint">
        <p><strong>Test:</strong> Utilisez les clients importés ou créez un nouveau client</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../services/AuthService.js'
import { CustomerService } from '../services/CustomerService.js'

const router = useRouter()

// État
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const isLoggedIn = ref(false)
const currentCustomer = ref(null)
const showUserList = ref(true)
const existingCustomers = ref([])

// Initialisation
onMounted(async () => {
  // Charger les clients existants
  await loadExistingCustomers()
  
  // Vérifier si déjà connecté
  const customerId = AuthService.getCustomerId()
  const customerEmail = AuthService.getCustomerEmail()

  if (customerId && customerEmail) {
    isLoggedIn.value = true
    const customer = await CustomerService.getCustomer(customerId)
    if (customer) {
      currentCustomer.value = customer
    }
  }
})

// Charger les clients existants depuis PrestaShop
const loadExistingCustomers = async () => {
  try {
    const customers = await CustomerService.getAllCustomers()
    existingCustomers.value = customers || []
    console.log(`✅ ${existingCustomers.value.length} client(s) trouvé(s)`)
  } catch (error) {
    console.error('Erreur lors du chargement des clients:', error)
    existingCustomers.value = []
  }
}

// Connexion rapide via sélection
const quickLogin = (customer) => {
  AuthService.loginCustomer(customer.id, customer.email)
  currentCustomer.value = customer
  isLoggedIn.value = true
}

// Connexion
const handleLogin = async () => {
  errorMessage.value = ''
  
  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs'
    return
  }

  isLoading.value = true

  try {
    const result = await CustomerService.loginCustomer(email.value, password.value)

    if (result.success) {
      currentCustomer.value = result.customer
      isLoggedIn.value = true
      email.value = ''
      password.value = ''
    } else {
      errorMessage.value = result.message || 'Erreur de connexion'
    }
  } catch (error) {
    console.error('Erreur:', error)
    errorMessage.value = 'Erreur lors de la connexion'
  } finally {
    isLoading.value = false
  }
}

// Continuer en tant qu'invité
const handleContinueAsGuest = () => {
  // Créer un client temporaire
  const guestId = Math.floor(Math.random() * 10000)
  AuthService.loginCustomer(guestId, `guest-${guestId}@guest.local`)
  
  currentCustomer.value = {
    id: guestId,
    email: `guest-${guestId}@guest.local`,
    firstname: 'Invité',
    lastname: 'PrestaVue',
    address: {
      address1: '123 Rue de la Paix',
      postcode: '75000',
      city: 'Paris',
      country: '8',
    },
  }
  
  isLoggedIn.value = true
}

// Continuer les achats
const handleContinueShopping = () => {
  router.push('/shop')
}

// Déconnexion
const handleLogout = () => {
  AuthService.logout()
  isLoggedIn.value = false
  currentCustomer.value = null
  email.value = ''
  password.value = ''
  errorMessage.value = ''
}
</script>

<style scoped>
.shop-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a2a6c 0%, #2c3e50 100%);
  font-family: 'Segoe UI', sans-serif;
  padding: 20px;
}

.shop-login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 20px;
}

.login-header h1 {
  margin: 0;
  color: #1a2a6c;
  font-size: 28px;
}

.login-header p {
  margin: 8px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.login-form,
.user-list-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-list-section {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-list-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
  text-align: center;
}

.users-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 10px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.user-card:hover {
  border-color: #3498db;
  background: linear-gradient(135deg, #e0e7ff 0%, #b4c8ff 100%);
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.user-card.guest {
  background: linear-gradient(135deg, #fff9e6 0%, #ffeccc 100%);
}

.user-card.guest:hover {
  border-color: #f39c12;
  background: linear-gradient(135deg, #fff5cc 0%, #ffe6b3 100%);
}

.user-icon {
  font-size: 32px;
  min-width: 40px;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.user-email {
  font-size: 13px;
  color: #7f8c8d;
}

.login-toggle {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid #ecf0f1;
}

.btn-switch-form {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  padding: 8px 16px;
  transition: color 0.3s;
}

.btn-switch-form:hover {
  color: #2980b9;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.input-field {
  padding: 12px;
  border: 2px solid #bdc3c7;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.input-field:disabled {
  background-color: #ecf0f1;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #f5c6cb;
}

.btn-login {
  padding: 14px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-login:hover:not(:disabled) {
  background-color: #229954;
}

.btn-login:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.login-alternatives {
  display: flex;
  gap: 10px;
}

.btn-guest {
  flex: 1;
  padding: 12px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.btn-guest:hover {
  background-color: #7f8c8d;
}

.login-success {
  text-align: center;
}

.success-icon {
  font-size: 48px;
  color: #27ae60;
  margin-bottom: 15px;
}

.login-success h2 {
  color: #1a2a6c;
  margin: 15px 0;
}

.customer-info {
  background-color: #ecf0f1;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.customer-info p {
  margin: 8px 0;
  color: #2c3e50;
  font-size: 14px;
}

.customer-info strong {
  color: #1a2a6c;
}

.address-city {
  font-size: 13px;
  color: #7f8c8d;
}

.btn-continue-large {
  width: 100%;
  padding: 14px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin: 15px 0;
  transition: background-color 0.3s;
}

.btn-continue-large:hover {
  background-color: #2980b9;
}

.btn-logout-shop {
  width: 100%;
  padding: 12px;
  background-color: transparent;
  color: #e74c3c;
  border: 2px solid #e74c3c;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-logout-shop:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

.demo-hint {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
  color: #7f8c8d;
  font-size: 12px;
}

.demo-hint p {
  margin: 0;
}

@media (max-width: 600px) {
  .shop-login-card {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
</style>
