<template>
  <div class="dashboard-container">
    <h1>📊 Tableau de bord</h1>
    <p class="subtitle">Gestion des commandes et statistiques</p>

    <!-- Onglets -->
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'orders' }"
        @click="activeTab = 'orders'"
        class="tab-btn"
      >
        📋 Commandes
      </button>
      <button
        :class="{ active: activeTab === 'stats' }"
        @click="activeTab = 'stats'"
        class="tab-btn"
      >
        📈 Statistiques
      </button>
    </div>

    <!-- Onglet Commandes -->
    <div v-if="activeTab === 'orders'" class="tab-content">
      <div class="card">
        <div class="card-header">
          <h2>Liste des commandes</h2>
          <button @click="refreshOrders" class="btn-refresh">🔄 Actualiser</button>
        </div>

        <div v-if="loadingOrders" class="loading">Chargement des commandes...</div>

        <div v-else-if="orders.length === 0" class="empty-state">
          <p>Aucune commande trouvée.</p>
        </div>

        <div v-else class="orders-table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client ID</th>
                <th>Total</th>
                <th>Mode de paiement</th>
                <th>État actuel</th>
                <th>Nouvel état</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                <td class="ref-cell">
                  <strong>{{ order.reference }}</strong>
                </td>
                <td>{{ order.idCustomer }}</td>
                <td class="price-cell">{{ order.totalPaid }}€</td>
                <td>{{ order.paymentMethod }}</td>
                <td>
                  <span :class="['state-badge', getStateBadgeClass(order.currentState)]">
                    {{ OrderService.getStateLabel(order.currentState) }}
                  </span>
                </td>
                <td>
                  <select
                    v-model.number="order.selectedNewState"
                    class="state-select"
                  >
                    <option value="">-- Choisir --</option>
                    <option v-for="state in availableStates" :key="state.id" :value="state.id">
                      {{ state.label }}
                    </option>
                  </select>
                </td>
                <td class="date-cell">{{ formatDate(order.dateAdd) }}</td>
                <td>
                  <button
                    @click="updateOrderState(order)"
                    :disabled="!order.selectedNewState || updatingOrders[order.id]"
                    class="btn-update-state"
                  >
                    <span v-if="!updatingOrders[order.id]">✓ Mettre à jour</span>
                    <span v-else>...</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Onglet Statistiques -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-label">Total commandes</div>
            <div class="stat-value">{{ orders.length }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Montant total</div>
            <div class="stat-value">{{ totalRevenue.toFixed(2) }}€</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✓</div>
          <div class="stat-content">
            <div class="stat-label">Commandes livrées</div>
            <div class="stat-value">{{ deliveredCount }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-label">En attente</div>
            <div class="stat-value">{{ pendingCount }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-label">Annulées</div>
            <div class="stat-value">{{ cancelledCount }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🚚</div>
          <div class="stat-content">
            <div class="stat-label">En livraison</div>
            <div class="stat-value">{{ shippingCount }}</div>
          </div>
        </div>
      </div>

      <!-- Détails par état -->
      <div class="card">
        <h2>Répartition par état</h2>
        <div class="states-breakdown">
          <div v-for="state in availableStates" :key="state.id" class="state-breakdown-item">
            <div class="breakdown-label">{{ state.label }}</div>
            <div class="breakdown-bar">
              <div
                class="breakdown-fill"
                :style="{ width: getStatePercentage(state.id) + '%' }"
              ></div>
            </div>
            <div class="breakdown-count">{{ getStateCount(state.id) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages de succès/erreur -->
    <div v-if="successMessage" class="success-message">
      ✓ {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="error-message">
      ⚠️ {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { OrderService } from '../services/OrderService.js'

// État
const activeTab = ref('orders')
const orders = ref([])
const loadingOrders = ref(false)
const updatingOrders = ref({})
const successMessage = ref('')
const errorMessage = ref('')

const availableStates = OrderService.getAvailableStates()

// Initialisation
onMounted(async () => {
  await refreshOrders()
})

// Récupère les commandes
const refreshOrders = async () => {
  loadingOrders.value = true
  try {
    const data = await OrderService.getOrders()
    orders.value = data.map(order => ({
      ...order,
      selectedNewState: '',
    }))
  } catch (error) {
    console.error('Erreur récupération commandes:', error)
    errorMessage.value = 'Erreur lors du chargement des commandes'
  } finally {
    loadingOrders.value = false
  }
}

// Met à jour l'état d'une commande
const updateOrderState = async (order) => {
  if (!order.selectedNewState) return

  updatingOrders.value[order.id] = true

  try {
    const result = await OrderService.updateOrderState(order.id, order.selectedNewState)

    if (result.success) {
      order.currentState = order.selectedNewState
      order.selectedNewState = ''
      successMessage.value = `Commande ${order.reference} mise à jour!`
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message || 'Erreur lors de la mise à jour'
    }
  } catch (error) {
    console.error('Erreur update:', error)
    errorMessage.value = 'Erreur lors de la mise à jour'
  } finally {
    updatingOrders.value[order.id] = false
  }
}

// Utilitaires de formatage
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStateBadgeClass = (stateId) => {
  const classes = {
    1: 'cancelled',
    2: 'paid',
    3: 'preparing',
    4: 'shipping',
    5: 'delivered',
    6: 'refunded',
    7: 'error',
    8: 'pending',
    9: 'pending-delivery',
  }
  return classes[stateId] || 'unknown'
}

// Statistiques
const totalRevenue = computed(() => {
  return orders.value.reduce((acc, order) => acc + order.totalPaid, 0)
})

const deliveredCount = computed(() => {
  return orders.value.filter(o => o.currentState === 5).length
})

const pendingCount = computed(() => {
  return orders.value.filter(o => [8, 9].includes(o.currentState)).length
})

const cancelledCount = computed(() => {
  return orders.value.filter(o => o.currentState === 1).length
})

const shippingCount = computed(() => {
  return orders.value.filter(o => o.currentState === 4).length
})

const getStateCount = (stateId) => {
  return orders.value.filter(o => o.currentState === stateId).length
}

const getStatePercentage = (stateId) => {
  if (orders.value.length === 0) return 0
  return (getStateCount(stateId) / orders.value.length) * 100
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.dashboard-container h1 {
  color: #1a2a6c;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 30px;
}

/* === ONGLETS === */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #ecf0f1;
}

.tab-btn {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #7f8c8d;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: 0.3s;
  font-size: 16px;
}

.tab-btn:hover {
  color: #1a2a6c;
}

.tab-btn.active {
  color: #1a2a6c;
  border-bottom-color: #27ae60;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* === CARTES === */
.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  color: #1a2a6c;
}

.btn-refresh {
  padding: 10px 15px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-refresh:hover {
  background-color: #2980b9;
}

/* === TABLEAU COMMANDES === */
.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.orders-table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th {
  background-color: #1a2a6c;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
}

.orders-table td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.orders-table tr:hover {
  background-color: #f9f9f9;
}

.ref-cell {
  color: #27ae60;
  font-weight: 600;
}

.price-cell {
  color: #27ae60;
  font-weight: 600;
}

.date-cell {
  font-size: 12px;
  color: #7f8c8d;
}

/* === BADGES ÉTAT === */
.state-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.state-badge.delivered {
  background-color: #d4edda;
  color: #155724;
}

.state-badge.paid {
  background-color: #d1ecf1;
  color: #0c5460;
}

.state-badge.preparing {
  background-color: #fff3cd;
  color: #856404;
}

.state-badge.shipping {
  background-color: #e2e3e5;
  color: #383d41;
}

.state-badge.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.state-badge.pending,
.state-badge.pending-delivery {
  background-color: #fff3cd;
  color: #856404;
}

.state-badge.error {
  background-color: #f8d7da;
  color: #721c24;
}

.state-badge.refunded {
  background-color: #d1ecf1;
  color: #0c5460;
}

/* === SELECT ÉTAT === */
.state-select {
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  background-color: white;
  color: #2c3e50;
  cursor: pointer;
  font-size: 14px;
}

.state-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

/* === BOUTON UPDATE === */
.btn-update-state {
  padding: 8px 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: 0.3s;
}

.btn-update-state:hover:not(:disabled) {
  background-color: #229954;
}

.btn-update-state:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* === STATISTIQUES === */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1a2a6c;
  margin-top: 5px;
}

/* === RÉPARTITION ÉTATS === */
.states-breakdown {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.state-breakdown-item {
  display: grid;
  grid-template-columns: 150px 1fr 50px;
  gap: 15px;
  align-items: center;
}

.breakdown-label {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 600;
}

.breakdown-bar {
  background-color: #ecf0f1;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.breakdown-fill {
  background-color: #27ae60;
  height: 100%;
  transition: width 0.3s ease;
}

.breakdown-count {
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #1a2a6c;
  min-width: 50px;
}

/* === MESSAGES === */
.success-message,
.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  font-weight: 600;
  animation: slideInUp 0.3s ease;
  z-index: 1000;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .orders-table {
    font-size: 12px;
  }

  .orders-table th,
  .orders-table td {
    padding: 10px 5px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .state-breakdown-item {
    grid-template-columns: 100px 1fr 40px;
  }
}
</style>
