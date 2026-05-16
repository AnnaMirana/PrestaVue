# 📚 GUIDE COMPLET - PrestaVue J1 & J2
## Documentation détaillée ligne par ligne

**Projet**: PrestaVue - Interface e-commerce Vue 3 pour PrestaShop  
**Dates**: Jour 1 (11 mai) et Jour 2 (12 mai 2026)  
**Auteur**: ITU Madagascar - P17  
**Version**: 1.0

---

## TABLE DES MATIÈRES

1. [Introduction au projet](#introduction)
2. [Architecture générale](#architecture)
3. [Jour 1 - Configuration initiale](#jour1)
4. [Jour 2 - Améliorations](#jour2)
5. [Explication détaillée des fichiers](#fichiers)
6. [Guide d'utilisation](#utilisation)

---

## <a name="introduction"></a>1️⃣ INTRODUCTION AU PROJET

### Qu'est-ce que PrestaVue ?

PrestaVue est une **interface moderne** créée avec **Vue 3** pour gérer une boutique e-commerce liée à **PrestaShop**.

**Pourquoi?**
- PrestaShop est complexe et ancien (design des années 2010)
- PrestaVue offre une interface moderne et rapide
- Données stockées dans PrestaShop, affichées via PrestaVue
- Communication en format XML via API PrestaShop

### Les technologies utilisées

```
┌─────────────────────────────────────────────────────┐
│         NAVIGATEUR UTILISATEUR (Chrome/Firefox)    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │    PRESTAVUE (Interface moderne)         │      │
│  │  • Vue 3 (Framework front-end)           │      │
│  │  • Vite (Bundler rapide)                 │      │
│  │  • Router (Navigation entre pages)       │      │
│  ├──────────────────────────────────────────┤      │
│  │  Pages:                                  │      │
│  │  • LoginView (Connexion backoffice)      │      │
│  │  • BackofficeView (Gestion boutique)     │      │
│  │  • FrontofficeView (Vitrine client)      │      │
│  │  • DashboardView (Statistiques)          │      │
│  └──────────────────────────────────────────┘      │
│                       ↕ (Communication XML)         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │    PRESTASHOP (Base de données)          │      │
│  │  • Serveur web (XAMPP)                   │      │
│  │  • API REST/XML                          │      │
│  │  • Base de données MySQL                 │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Technologie clé : API PrestaShop en XML

```xml
<!-- Exemple: Récupérer les produits -->
<prestashop>
  <product>
    <id>42</id>
    <name>
      <language id="1">Mon Produit</language>
    </name>
    <price>99.99</price>
    <reference>PROD001</reference>
  </product>
</prestashop>
```

---

## <a name="architecture"></a>2️⃣ ARCHITECTURE GÉNÉRALE

### Structure du projet

```
prestavuej1/
├── 📁 src/                          # Code source Vue 3
│   ├── 📁 assets/                   # Images, icônes
│   ├── 📁 components/               # Composants réutilisables
│   ├── 📁 views/                    # Pages principales
│   │   ├── LoginView.vue            # Connexion backoffice
│   │   ├── BackofficeView.vue       # Gestion boutique (admin)
│   │   ├── FrontofficeView.vue      # Vitrine client
│   │   ├── DashboardView.vue        # Statistiques
│   │   └── ShopLoginView.vue        # Connexion client
│   ├── 📁 services/                 # Logique métier (API)
│   │   ├── ApiService.js            # Communication API PrestaShop
│   │   ├── AuthService.js           # Gestion authentification
│   │   ├── CustomerService.js       # Clients
│   │   ├── ImportService.js         # Import fichiers CSV
│   │   ├── OrderService.js          # Commandes
│   │   ├── SearchService.js         # Recherche produits
│   │   ├── StockService.js          # Gestion stock
│   │   └── ResetService.js          # Nettoyage données
│   ├── 📁 config/                   # Configuration globale
│   │   └── importConfig.js          # Paramètres import
│   ├── App.vue                      # Composant racine
│   ├── main.js                      # Point d'entrée
│   ├── router.js                    # Configuration routes
│   └── style.css                    # CSS global
├── 📁 public/                       # Fichiers statiques
├── package.json                     # Dépendances Node.js
├── vite.config.js                   # Configuration Vite
├── *.csv                            # Fichiers de données de test
└── README.md                        # Documentation
```

### Comment Vue 3 fonctionne

**Vue 3** est un **framework JavaScript** qui crée des interfaces interactives.

**Concept clé: Réactivité**
```javascript
// Quand cette variable change...
const products = ref([])

// ...Vue remarque le changement et met à jour l'écran automatiquement
products.value = [
  { id: 1, name: 'Produit 1' }
]
```

**Cycle de vie d'une Vue**
```
1. Composant créé (onMounted)
   ↓
2. Charger les données (API)
   ↓
3. Afficher dans HTML (template)
   ↓
4. Utilisateur interagit (click, input)
   ↓
5. Vue met à jour (réactivité)
   ↓
6. Écran se rafraîchit
```

---

## <a name="jour1"></a>3️⃣ JOUR 1 - CONFIGURATION INITIALE

### 3.1 Création du projet avec Vite

**Commande initiale:**
```bash
npm create vite@latest prestavuej1 -- --template vue
cd prestavuej1
npm install
npm run dev
```

**Qu'est-ce que cela fait?**
- `npm create vite@latest` : Crée un nouveau projet Vite
- `--template vue` : Utilise le template Vue 3
- `npm install` : Installe les dépendances (npm packages)
- `npm run dev` : Lance le serveur de développement (http://localhost:5173)

### 3.2 Installation des dépendances

**package.json (après configuration)**
```json
{
  "name": "prestavuej1",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.4",
    "vue-router": "^4.2.2"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.3",
    "vite": "^4.3.9"
  }
}
```

**Explication:**
- `vue` : Framework pour créer l'interface
- `vue-router` : Gère la navigation entre pages
- Autres : Outils de développement

### 3.3 Structure des fichiers principaux

#### 📄 main.js - Point d'entrée

```javascript
// === IMPORTATIONS ===
import { createApp } from 'vue'           // Créer une app Vue
import App from './App.vue'               // Composant racine
import router from './router.js'          // Routes de navigation
import './style.css'                      // Styles globaux

// === CRÉATION DE L'APPLICATION ===
const app = createApp(App)                // Crée l'app avec App.vue

// === UTILISER LE ROUTEUR ===
app.use(router)                           // Ajoute la navigation

// === MONTER L'APP ===
app.mount('#app')                         // Attache à <div id="app">
```

**En français simple:**
1. Importer les outils Vue
2. Importer le composant principal (App.vue)
3. Créer l'application Vue
4. Ajouter le système de navigation
5. Afficher l'app dans le fichier HTML

#### 📄 router.js - Navigation entre pages

```javascript
// === IMPORTS ===
import { createRouter, createWebHistory } from 'vue-router'
import { AuthService } from './services/AuthService.js'

// === IMPORT DYNAMIQUE DES PAGES ===
// Charge les pages seulement quand nécessaire (performance)
const LoginView = () => import('./views/LoginView.vue')
const BackofficeView = () => import('./views/BackofficeView.vue')
const FrontofficeView = () => import('./views/FrontofficeView.vue')
const ShopLoginView = () => import('./views/ShopLoginView.vue')

// === DÉFINITION DES ROUTES ===
const routes = [
  {
    path: '/login',                       // URL du navigateur
    name: 'Login',                        // Nom de la route
    component: LoginView,                 // Quelle page afficher
    meta: {
      requiresAuth: false,                // N'a pas besoin de connexion
      title: 'Connexion - PrestaVue'
    }
  },
  {
    path: '/backoffice',                  // URL pour admin
    name: 'Backoffice',
    component: BackofficeView,
    meta: {
      requiresAuth: true,                 // DOIT être connecté en admin
      title: 'Backoffice - PrestaVue'
    }
  },
  {
    path: '/shop',                        // URL pour clients
    name: 'Shop',
    component: FrontofficeView,
    meta: {
      requiresAuth: false,
      title: 'Boutique - PrestaVue'
    }
  },
  {
    path: '/',                            // Accueil
    redirect: '/shop-login'               // Redirige vers login client
  }
]

// === CRÉATION DU ROUTEUR ===
const router = createRouter({
  history: createWebHistory(),            // Utilise l'historique du navigateur
  routes                                  // Ajoute les routes
})

// === PROTECTION DES ROUTES ===
// Vérifie avant d'accéder à chaque page
router.beforeEach((to, from, next) => {
  const isAuthenticated = AuthService.isAuthenticated()
  const requiresAuth = to.meta.requiresAuth !== false

  // Si pas connecté ET page nécessite connexion → rediriger vers login
  if (!isAuthenticated && requiresAuth) {
    next('/login')
    return
  }

  // Sinon → accès autorisé
  next()
})

export default router
```

**En français simple:**
- Routes = Liens entre URLs et pages (comme les chemins d'un site)
- `/shop` affiche la boutique pour clients
- `/backoffice` affiche l'administration (protégée)
- `beforeEach` : Vérifie avant chaque visite si l'utilisateur a le droit d'accéder

#### 📄 App.vue - Composant racine

```vue
<template>
  <!-- Affiche les pages selon la route active -->
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
* {
  margin: 0
  padding: 0
  box-sizing: border-box
}

body {
  font-family: 'Segoe UI', sans-serif
  background-color: #f5f5f5
}
</style>
```

**Explication:**
- `<RouterView />` : Affiche la page active selon l'URL
- CSS global : Styles appliqués à tout le projet

### 3.4 Services - Communication avec PrestaShop

#### 📄 services/ApiService.js - L'API

```javascript
// === URL DE BASE ===
const API_BASE = 'http://localhost/prestaShop/api'
const API_KEY = 'votre_clé_api'

// === SERVICE D'API ===
export const ApiService = {
  // RÉCUPÉRER des données (GET)
  // Exemple: ApiService.get('products') → récupère tous les produits
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/xml'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }
      
      return await response.text()  // Retourne le XML en texte
    } catch (error) {
      console.error('❌ Erreur GET:', error)
      return null
    }
  },

  // CRÉER ou MODIFIER des données (POST/PUT)
  // Exemple: ApiService.post('products', xmlData) → crée un produit
  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/xml'
        },
        body: data  // Les données en XML
      })
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }
      
      return {
        ok: true,
        text: await response.text()
      }
    } catch (error) {
      console.error('❌ Erreur POST:', error)
      return { ok: false }
    }
  },

  // SUPPRIMER des données (DELETE)
  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      })
      return response.ok
    } catch (error) {
      console.error('❌ Erreur DELETE:', error)
      return false
    }
  }
}
```

**Explication simple:**
- `get()` = Récupérer (exemple: lister les produits)
- `post()` = Créer (exemple: ajouter un produit)
- `delete()` = Supprimer (exemple: effacer un produit)

#### 📄 services/AuthService.js - Authentification

```javascript
// === STOCKAGE LOCAL (localStorage) ===
// Sauvegarde les infos même si on ferme le navigateur
const STORAGE_KEY = 'auth_user'

export const AuthService = {
  // Connexion = Sauvegarder les infos utilisateur
  loginCustomer(customerId, email) {
    const user = {
      id: customerId,
      email: email,
      loginTime: new Date().toISOString()
    }
    
    // Sauvegarder dans le navigateur
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    console.log('✅ Utilisateur connecté:', email)
  },

  // Vérifier si quelqu'un est connecté
  isAuthenticated() {
    const user = localStorage.getItem(STORAGE_KEY)
    return user !== null
  },

  // Récupérer l'ID du client connecté
  getCustomerId() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return user.id || null
  },

  // Récupérer l'email du client connecté
  getCustomerEmail() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return user.email || null
  },

  // Déconnexion = Supprimer les infos
  logout() {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ Utilisateur déconnecté')
  }
}
```

**Explication:**
- `localStorage` = Mémoire du navigateur (persiste même après fermeture)
- On sauvegarde l'ID et email du user
- Avant chaque action, on vérifie si quelqu'un est connecté

---

## <a name="jour2"></a>4️⃣ JOUR 2 - AMÉLIORATIONS

### 4.1 Dashboard avec statistiques

#### 📄 views/DashboardView.vue

```vue
<template>
  <div class="dashboard-container">
    <h1>📊 Tableau de bord</h1>
    
    <!-- Résumé du jour -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>📦 Commandes aujourd'hui</h3>
        <div class="stat-value">{{ ordersToday }}</div>
      </div>
      
      <div class="stat-card">
        <h3>💰 Montant du jour</h3>
        <div class="stat-value">{{ amountToday }}€</div>
      </div>
      
      <div class="stat-card">
        <h3>🎯 Total général</h3>
        <div class="stat-value">{{ totalAmount }}€</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { OrderService } from '../services/OrderService.js'

// === DONNÉES RÉACTIVES ===
const ordersToday = ref(0)      // Nombre de commandes
const amountToday = ref(0)      // Argent aujourd'hui
const totalAmount = ref(0)      // Argent total

// === AU DÉMARRAGE DE LA PAGE ===
onMounted(async () => {
  // Charger les commandes depuis PrestaShop
  const orders = await OrderService.getOrders()
  
  // Compter les commandes d'aujourd'hui
  const today = new Date().toDateString()
  const todayOrders = orders.filter(order => {
    return new Date(order.date_add).toDateString() === today
  })
  
  // Calculer les montants
  ordersToday.value = todayOrders.length
  amountToday.value = todayOrders.reduce((sum, order) => {
    return sum + parseFloat(order.total_paid)
  }, 0).toFixed(2)
  
  totalAmount.value = orders.reduce((sum, order) => {
    return sum + parseFloat(order.total_paid)
  }, 0).toFixed(2)
})
</script>

<style scoped>
.dashboard-container {
  padding: 40px
  max-width: 1200px
  margin: 0 auto
}

.stats-grid {
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))
  gap: 20px
  margin-top: 30px
}

.stat-card {
  background: white
  border-radius: 12px
  padding: 20px
  box-shadow: 0 2px 8px rgba(0,0,0,0.1)
}

.stat-value {
  font-size: 32px
  font-weight: bold
  color: #27ae60
  margin-top: 10px
}
</style>
```

**Explication:**
1. `onMounted` : Au chargement de la page, on récupère les commandes
2. `filter()` : Garder seulement celles d'aujourd'hui
3. `reduce()` : Faire la somme de tous les montants
4. Afficher les résultats dans l'HTML

### 4.2 Page de connexion client avec sélection d'utilisateur

#### 📄 views/ShopLoginView.vue (Jour 2)

```vue
<template>
  <div class="shop-login-container">
    <!-- JOUR 2 ADDITION: Sélection d'utilisateur existant -->
    <div v-if="!isLoggedIn && showUserList" class="user-list-section">
      <h3>Sélectionnez votre compte</h3>
      <div class="users-grid">
        <!-- Afficher chaque client -->
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
        
        <!-- Connexion anonyme -->
        <button @click="handleContinueAsGuest" class="user-card guest">
          <div class="user-icon">🕶️</div>
          <div class="user-name">Utilisateur anonyme</div>
          <div class="user-email">Sans connexion</div>
        </button>
      </div>
    </div>

    <!-- Formulaire de connexion classique (reste inchangé) -->
    <form v-else-if="!isLoggedIn" @submit.prevent="handleLogin">
      <!-- ... -->
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CustomerService } from '../services/CustomerService.js'
import { AuthService } from '../services/AuthService.js'

const showUserList = ref(true)           // Afficher la liste par défaut
const existingCustomers = ref([])        // Les clients chargés
const isLoggedIn = ref(false)            // Connecté ou pas?

// === AU DÉMARRAGE ===
onMounted(async () => {
  // Charger tous les clients depuis PrestaShop
  const customers = await CustomerService.getAllCustomers()
  existingCustomers.value = customers || []
})

// === CONNEXION RAPIDE ===
const quickLogin = (customer) => {
  // Sauvegarder que ce client est connecté
  AuthService.loginCustomer(customer.id, customer.email)
  isLoggedIn.value = true
  
  // Rediriger vers la boutique
  router.push('/shop')
}

// === CONNEXION ANONYME ===
const handleContinueAsGuest = () => {
  const guestId = Math.floor(Math.random() * 10000)
  AuthService.loginCustomer(guestId, `guest-${guestId}@guest.local`)
  isLoggedIn.value = true
  router.push('/shop')
}
</script>

<style scoped>
.user-list-section {
  animation: slideIn 0.3s ease-out
}

.users-grid {
  display: grid
  grid-template-columns: 1fr
  gap: 12px
  max-height: 400px
  overflow-y: auto
}

.user-card {
  display: flex
  align-items: center
  gap: 15px
  padding: 15px
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)
  border: 2px solid #e0e0e0
  border-radius: 8px
  cursor: pointer
  transition: all 0.3s
}

.user-card:hover {
  border-color: #3498db
  transform: translateX(5px)
}
</style>
```

**Explication jour 2:**
1. Au lieu de formulaire login, on montre une liste de clients
2. `getAllCustomers()` : Récupère tous les clients de PrestaShop
3. Clic sur un client = connexion instantanée (quickLogin)
4. Option "anonyme" pour continuer sans compte

### 4.3 Recherche multicritère - JOUR 2

#### 📄 services/SearchService.js

```javascript
export const SearchService = {
  /**
   * Rechercher des produits avec filtres
   * @param {object} filters - { name, categoryId, priceMin, priceMax }
   * @param {array} products - Liste locale des produits
   * @returns {array} Produits filtrés
   */
  search(filters = {}, products = null) {
    // Si des produits locaux sont fournis, les filtrer en JavaScript
    if (Array.isArray(products)) {
      return this.filterLocal(filters, products)
    }
    
    return []
  },

  /**
   * Filtrer les produits localement
   */
  filterLocal(filters, products) {
    if (!Array.isArray(products)) {
      return []
    }

    let results = [...products]  // Copie de la liste

    // === FILTRE PAR NOM ===
    // Exemple: chercher "chaise" → trouve "chaise blanche", "chaise rouge", etc.
    if (filters.name && filters.name.trim()) {
      const searchTerm = filters.name.toLowerCase()
      results = results.filter(p =>
        p.name?.toLowerCase().includes(searchTerm) ||
        p.reference?.toLowerCase().includes(searchTerm)
      )
    }

    // === FILTRE PAR PRIX MINIMUM ===
    // Exemple: priceMin = 50 → cache les produits < 50€
    if (filters.priceMin) {
      const minPrice = parseFloat(filters.priceMin)
      results = results.filter(p => p.price >= minPrice)
    }

    // === FILTRE PAR PRIX MAXIMUM ===
    // Exemple: priceMax = 500 → cache les produits > 500€
    if (filters.priceMax) {
      const maxPrice = parseFloat(filters.priceMax)
      results = results.filter(p => p.price <= maxPrice)
    }

    return results
  }
}
```

**Explication:**
- `filter()` = Garder seulement les éléments qui correspondent
- `includes()` = Chercher si une chaîne est dans une autre
- Chaque filtre réduit la liste

#### 📄 Utilisation dans FrontofficeView.vue

```javascript
// === ÉTAT POUR LES FILTRES ===
const searchFilters = ref({
  name: '',
  priceMin: '',
  priceMax: ''
})

const products = ref([])     // Produits filtrés à afficher
const allProducts = ref([])  // Tous les produits (backup)

// === APPLIQUER LES FILTRES ===
const applySearchFilters = () => {
  const results = SearchService.search(
    searchFilters.value,
    allProducts.value
  )
  products.value = results
}

// === RÉINITIALISER LES FILTRES ===
const resetSearchFilters = () => {
  searchFilters.value = { name: '', priceMin: '', priceMax: '' }
  products.value = [...allProducts.value]
}
```

### 4.4 Import de fichiers CSV - Jour 1-2

#### 📄 services/ImportService.js - Partie 1: Validation

```javascript
// === VALIDATION INTELLIGENTE ===
const SmartValidation = {
  // Vérifier que les colonnes requises existent
  validateColumnNames(headers, requiredColumns) {
    // Convertir en minuscules et sans espaces
    const headerSet = new Set(
      headers.map(h => h.toLowerCase().trim())
    )
    
    // Chercher les colonnes manquantes
    const missingColumns = requiredColumns.filter(col =>
      !headerSet.has(col.toLowerCase())
    )
    
    if (missingColumns.length > 0) {
      return {
        valid: false,
        missingColumns,
        message: `Colonnes manquantes: ${missingColumns.join(', ')}`
      }
    }
    
    return { valid: true, missingColumns: [] }
  },

  // Vérifier le format de date DD/MM/YYYY
  validateDateFormat(dateStr, fieldName = 'date') {
    if (!dateStr) return { valid: false, message: `${fieldName} vide` }
    
    // Expression régulière: DD/MM/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = dateStr.trim().match(dateRegex)
    
    if (!match) {
      return {
        valid: false,
        message: `${fieldName} doit être DD/MM/YYYY, reçu: ${dateStr}`
      }
    }
    
    const [, day, month, year] = match.map(Number)
    
    // Vérifier que le mois est valide (1-12)
    if (month < 1 || month > 12) {
      return { valid: false, message: `Mois invalide: ${month}` }
    }
    
    // Vérifier que le jour est valide
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (day < 1 || day > daysInMonth[month - 1]) {
      return { valid: false, message: `Jour invalide: ${day}` }
    }
    
    return { valid: true, value: dateStr }
  },

  // Vérifier que le montant est positif
  validatePositiveAmount(amountStr, fieldName = 'montant') {
    if (!amountStr && amountStr !== 0) {
      return { valid: false, message: `${fieldName} vide` }
    }
    
    // Nettoyer: enlever €, espaces, convertir virgule en point
    let cleaned = String(amountStr)
      .replace(/€/g, '')
      .replace(/\s+/g, '')
      .replace(',', '.')
      .trim()
    
    const amount = parseFloat(cleaned)
    
    // Vérifier que c'est un nombre
    if (isNaN(amount)) {
      return { valid: false, message: `${fieldName} invalide: ${amountStr}` }
    }
    
    // Vérifier que c'est positif
    if (amount < 0) {
      return { valid: false, message: `${fieldName} doit être positif` }
    }
    
    return { valid: true, value: amount.toFixed(2) }
  }
}
```

**Explication:**
1. `validateColumnNames()` : Vérifie que le CSV a les bonnes colonnes
2. `validateDateFormat()` : Vérifie que les dates sont en DD/MM/YYYY
3. `validatePositiveAmount()` : Vérifie que les prix sont positifs
4. Chaque validation retourne `{ valid: boolean, message: string }`

#### 📄 services/ImportService.js - Partie 2: Import produits

```javascript
export const ImportService = {
  // === IMPORTER LES PRODUITS ===
  async importProductsAndCategories(rows) {
    console.log(`\n📦 IMPORT PRODUITS (${rows.length} lignes)`)
    
    // Vérifier les colonnes requises
    const requiredColumns = ['nom', 'reference', 'prix_ttc']
    const headers = Object.keys(rows[0])
    const columnCheck = SmartValidation.validateColumnNames(
      headers, 
      requiredColumns
    )
    
    if (!columnCheck.valid) {
      console.error(`❌ ${columnCheck.message}`)
      return
    }

    let successCount = 0
    let errorCount = 0
    const existingRefs = new Set()  // Références déjà importées

    // === BOUCLER SUR CHAQUE LIGNE ===
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Valider et corriger les données
      const { valid, errors, corrections, data } = 
        SmartValidation.validateAndFixProduct(row, i)

      if (!valid) {
        console.warn(`❌ Ligne ${i+1} ignorée: ${errors.join(', ')}`)
        errorCount++
        continue
      }

      // Vérifier les doublons
      if (existingRefs.has(data.reference)) {
        console.warn(`⚠️ Référence dupliquée: ${data.reference}`)
        continue
      }
      existingRefs.add(data.reference)

      // === CRÉER LE XML POUR PRESTASHOP ===
      const productXml = `
        <prestashop>
          <product>
            <name>
              <language id="1"><![CDATA[${data.nom}]]></language>
            </name>
            <reference>${data.reference}</reference>
            <price>${data.prix_ttc}</price>
            <active>1</active>
          </product>
        </prestashop>`

      try {
        // Envoyer à l'API PrestaShop
        await ApiService.post('products', productXml)
        
        successCount++
        console.log(`✅ "${data.nom}" importé`)

      } catch (error) {
        console.error(`❌ Erreur: ${error.message}`)
        errorCount++
      }
    }

    console.log(`📊 Résumé: ${successCount} produits, ${errorCount} erreurs`)
  }
}
```

**Explication:**
1. Pour chaque ligne du CSV
2. Valider les données (colonnes, dates, montants)
3. Créer un XML conforme à PrestaShop
4. Envoyer à l'API PrestaShop
5. Compter les succès et erreurs

---

## <a name="fichiers"></a>5️⃣ EXPLICATION DÉTAILLÉE DES FICHIERS

### 5.1 Structure CSV d'importation

#### 📄 produit.csv

```csv
nom,reference,prix_ttc,prix_achat,date_availability_produit,categorie
Chaise Bureau,CHAIR001,150.00,75.00,15/05/2026,Mobilier
Table Conférence,TABLE001,500.00,250.00,14/05/2026,Mobilier
Stylo Bic,PEN001,2.50,1.00,16/05/2026,Fournitures
```

**Explication des colonnes:**
- `nom` : Nom du produit (ce que le client voit)
- `reference` : Code unique du produit (ex: CHAIR001)
- `prix_ttc` : Prix avec taxes
- `prix_achat` : Coût d'achat (calculé à partir de là)
- `date_availability_produit` : Quand le produit a été lancé
- `categorie` : Catégorie du produit

#### 📄 client.csv

```csv
nom,prenom,email,pwd,adresse,codepostal,ville
Dupont,Jean,jean@example.com,pass123,123 Rue A,75001,Paris
Martins,Marie,marie@example.com,pass456,456 Rue B,69000,Lyon
```

#### 📄 detail-produit.csv

```csv
reference,taille,couleur,stock_initial
CHAIR001,M,Noir,50
CHAIR001,L,Noir,30
CHAIR001,M,Gris,40
```

---

## <a name="utilisation"></a>6️⃣ GUIDE D'UTILISATION

### Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Ouvrir http://localhost:5173 dans le navigateur
```

### Flux utilisateur BACKOFFICE (Admin)

```
1. Aller sur http://localhost:5173/login
   ↓
2. Connexion admin (voir credentials en backoffice)
   ↓
3. Voir le menu:
   - 📥 Import Global → Importer CSV
   - 🗑️ Réinitialisation → Vider base
   - 📊 Dashboard → Voir statistiques
   - 📦 Gestion Stock → Modifier stock
   - 🖍️ Voir boutique → Aller au front
```

### Flux utilisateur FRONTOFFICE (Client)

```
1. Aller sur http://localhost:5173/shop-login
   ↓
2. NOUVEAU (Jour 2): Sélectionner client existant
   OU Connexion manuelle
   OU Continuer anonyme
   ↓
3. Voir catalogue avec:
   - NOUVEAU (Jour 2): Badges HOT/NEW
   - NOUVEAU (Jour 2): Recherche par nom/prix
   ↓
4. Ajouter au panier
   ↓
5. Validation commande
   ↓
6. Paiement à la livraison
```

### Exemple: Importer des produits

1. Aller sur /backoffice
2. Cliquer sur "📥 Import Global"
3. Charger `produit.csv`
4. Charger `client.csv` (optionnel)
5. Charger `detail-produit.csv` (optionnel)
6. Cliquer "🚀 LANCER L'IMPORTATION"
7. Attendre le rapport

---

## 📊 RÉSUMÉ JOUR 1-2

| Jour | Fonctionnalité | État |
|------|----------------|------|
| Jour 1 | Configuration Vite + Vue | ✅ |
| Jour 1 | Backoffice login protégé | ✅ |
| Jour 1 | Import CSV avec validation | ✅ |
| Jour 1 | Frontoffice catalogue | ✅ |
| Jour 1 | Panier et commandes | ✅ |
| Jour 2 | Dashboard statistiques | ✅ |
| Jour 2 | Sélection utilisateur | ✅ |
| Jour 2 | Recherche multicritère | ✅ |
| Jour 2 | Badges HOT/NEW produits | ✅ |

---

## 🎓 CONCEPTS CLÉS EXPLIQUÉS

### Réactivité Vue

```javascript
// Quand on change cette variable...
const count = ref(0)

// ...Vue met à jour AUTOMATIQUEMENT le HTML
count.value = 5  // L'écran se rafraîchit tout seul
```

### Computed (Valeurs calculées)

```javascript
// Prix = Quantité × Prix unitaire
const total = computed(() => {
  return cart.value.reduce((sum, item) => 
    sum + item.price * item.quantity, 0
  )
})

// Total se recalcule automatiquement si cart change
```

### API Calls asynchrones

```javascript
// on attend la réponse du serveur
const fetchProducts = async () => {
  loading.value = true           // Montrer "Chargement..."
  const xml = await ApiService.get('products')  // ATTENDRE
  products.value = parseXML(xml) // Afficher les résultats
  loading.value = false          // Cacher "Chargement..."
}
```

---

**FIN DOCUMENTATION JOUR 1-2**

