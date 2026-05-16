<template>
  <div class="stock-management-container">
    <h2>📦 Gestion du Stock</h2>
    <p class="subtitle">Ajouter, retirer ou modifier le stock des produits</p>

    <!-- Section Produits -->
    <div class="section">
      <div class="section-header">
        <h3>📋 Stock Actuel</h3>
        <div class="search-bar">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Chercher un produit..."
            class="search-input"
          />
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Chargement des produits...</p>
      </div>

      <div v-else class="products-list">
        <div v-if="filteredProducts.length === 0" class="empty-state">
          <p>Aucun produit trouvé.</p>
        </div>

        <div v-for="product in filteredProducts" :key="product.reference" class="product-stock-card">
          <div class="card-header">
            <div class="product-info">
              <h4>{{ product.name }}</h4>
              <p class="reference">Réf: {{ product.reference }}</p>
            </div>
            <div class="current-stock">
              <span class="stock-badge" :class="{ 'stock-low': product.currentQuantity < 5 }">
                📊 {{ product.currentQuantity }} unité(s)
              </span>
            </div>
          </div>

          <div class="card-actions">
            <!-- Action: Ajouter du stock -->
            <div class="action-group">
              <input
                v-model.number="product.addQuantity"
                type="number"
                min="1"
                placeholder="Quantité à ajouter"
                class="input-qty"
              />
              <button
                @click="handleAddStock(product)"
                :disabled="!product.addQuantity || product.addQuantity <= 0"
                class="btn btn-add"
              >
                ➕ Ajouter
              </button>
            </div>

            <!-- Action: Retirer du stock -->
            <div class="action-group">
              <input
                v-model.number="product.removeQuantity"
                type="number"
                min="1"
                placeholder="Quantité à retirer"
                class="input-qty"
              />
              <button
                @click="handleRemoveStock(product)"
                :disabled="!product.removeQuantity || product.removeQuantity <= 0"
                class="btn btn-remove"
              >
                ➖ Retirer
              </button>
            </div>

            <!-- Action: Définir stock -->
            <div class="action-group">
              <input
                v-model.number="product.setQuantity"
                type="number"
                min="0"
                placeholder="Définir stock"
                class="input-qty"
              />
              <button
                @click="handleSetStock(product)"
                :disabled="product.setQuantity === null || product.setQuantity === undefined"
                class="btn btn-set"
              >
                ✏️ Définir
              </button>
            </div>
          </div>

          <!-- Dernier changement -->
          <div v-if="product.lastUpdate" class="card-footer">
            <small>
              Dernier changement: {{ formatDate(product.lastUpdate) }}
              <span v-if="product.lastReason" class="badge">{{ product.lastReason }}</span>
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Rapide: Voir l'historique -->
    <div class="section">
      <div class="section-header">
        <h3>📊 Actions Rapides</h3>
      </div>

      <div class="quick-actions">
        <button @click="viewFullHistory" class="btn btn-secondary">
          📜 Voir l'historique complet
        </button>
        <button @click="exportToCSV" class="btn btn-secondary">
          📥 Exporter en CSV
        </button>
        <button @click="goToStockEvolution" class="btn btn-secondary">
          📈 Voir l'évolution journalière
        </button>
      </div>
    </div>

    <!-- Histoique simplifié (derniers changements) -->
    <div v-if="recentHistory.length > 0" class="section">
      <div class="section-header">
        <h3>🕐 Derniers Changements</h3>
      </div>

      <table class="history-table">
        <thead>
          <tr>
            <th>Date/Heure</th>
            <th>Produit</th>
            <th>Changement</th>
            <th>Raison</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in recentHistory" :key="entry.id" :class="{ 'change-positive': entry.change > 0, 'change-negative': entry.change < 0 }">
            <td>{{ formatDateTime(entry.timestamp) }}</td>
            <td>{{ entry.name }} ({{ entry.reference }})</td>
            <td>{{ entry.oldQuantity }} → {{ entry.newQuantity }} <span class="badge-change">{{ entry.change > 0 ? '+' : '' }}{{ entry.change }}</span></td>
            <td><span class="badge">{{ entry.reason }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Message de feedback -->
    <div v-if="feedback.message" :class="['feedback', feedback.type]">
      {{ feedback.message }}
    </div>
  </div>
</template>

<script>
import { StockService } from '../services/StockService';

export default {
  name: 'StockManagement',
  data() {
    return {
      searchTerm: '',
      products: [],
      loading: false,
      feedback: { message: null, type: null },
      recentHistory: []
    };
  },
  computed: {
    filteredProducts() {
      return this.products.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  },
  methods: {
    async loadProducts() {
      this.loading = true;
      try {
        // Initialiser le service
        StockService.initDB();

        // Charger les stocks actuels
        const allStocks = StockService.getAllStocks();
        const report = StockService.generateStockReport();

        this.products = report.map(item => ({
          ...item,
          addQuantity: null,
          removeQuantity: null,
          setQuantity: null
        }));

        // Charger l'historique récent
        const fullHistory = StockService.getFullHistory();
        this.recentHistory = fullHistory.slice(-10).reverse();

        console.log('✅ Produits chargés:', this.products.length);
      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        this.showFeedback('Erreur chargement des produits', 'error');
      } finally {
        this.loading = false;
      }
    },

    handleAddStock(product) {
      if (!product.addQuantity || product.addQuantity <= 0) return;

      const result = StockService.addStock(
        product.reference,
        product.name,
        product.addQuantity
      );

      if (result.success) {
        product.currentQuantity = result.newQuantity;
        product.addQuantity = null;
        product.lastUpdate = new Date().toISOString();
        product.lastReason = 'ajout';
        this.showFeedback(`✅ ${result.message}`, 'success');
        this.loadProducts(); // Actualiser
      } else {
        this.showFeedback(`❌ ${result.message}`, 'error');
      }
    },

    handleRemoveStock(product) {
      if (!product.removeQuantity || product.removeQuantity <= 0) return;

      const result = StockService.removeStock(
        product.reference,
        product.name,
        product.removeQuantity
      );

      if (result.success) {
        product.currentQuantity = result.newQuantity;
        product.removeQuantity = null;
        product.lastUpdate = new Date().toISOString();
        product.lastReason = 'retrait';
        this.showFeedback(`✅ ${result.message}`, 'success');
        this.loadProducts(); // Actualiser
      } else {
        this.showFeedback(`❌ ${result.message}`, 'error');
      }
    },

    handleSetStock(product) {
      if (product.setQuantity === null || product.setQuantity === undefined) return;

      const result = StockService.setStock(
        product.reference,
        product.name,
        product.setQuantity
      );

      if (result.success) {
        product.currentQuantity = result.newQuantity;
        product.setQuantity = null;
        product.lastUpdate = new Date().toISOString();
        product.lastReason = 'manuel';
        this.showFeedback(`✅ ${result.message}`, 'success');
        this.loadProducts(); // Actualiser
      } else {
        this.showFeedback(`❌ ${result.message}`, 'error');
      }
    },

    viewFullHistory() {
      const history = StockService.getFullHistory();
      console.log('📜 Historique complet:', history);
      alert(`Historique: ${history.length} changements enregistrés (voir console)`);
    },

    exportToCSV() {
      const csv = StockService.exportHistoryToCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `stock-history-${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
      this.showFeedback('✅ Fichier CSV téléchargé', 'success');
    },

    goToStockEvolution() {
      // Émettre un événement pour passer à la page d'évolution
      this.$emit('navigate', 'stock-evolution');
      // Ou utiliser le router si disponible
      if (this.$router) {
        this.$router.push({ name: 'StockEvolution' });
      }
    },

    showFeedback(message, type) {
      this.feedback = { message, type };
      setTimeout(() => {
        this.feedback = { message: null, type: null };
      }, 3000);
    },

    formatDate(isoString) {
      return new Date(isoString).toLocaleDateString('fr-FR');
    },

    formatDateTime(isoString) {
      return new Date(isoString).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  },
  mounted() {
    this.loadProducts();
    // Actualiser les données toutes les 5 secondes
    this.refreshInterval = setInterval(() => {
      this.loadProducts();
    }, 5000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
};
</script>

<style scoped>
.stock-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 28px;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 14px;
}

/* ========== SECTIONS ========== */
.section {
  background: white;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
  flex-wrap: wrap;
}

.section-header h3 {
  color: #2c3e50;
  font-size: 20px;
  margin: 0;
}

.search-bar {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

/* ========== PRODUITS ========== */
.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 15px;
}

.product-stock-card {
  background: #f8f9fa;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s;
}

.product-stock-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  gap: 10px;
}

.product-info h4 {
  color: #2c3e50;
  font-size: 16px;
  margin: 0 0 5px 0;
}

.reference {
  color: #7f8c8d;
  font-size: 12px;
  margin: 0;
}

.stock-badge {
  display: inline-block;
  padding: 8px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
}

.stock-badge.stock-low {
  background: #fff3e0;
  color: #e65100;
}

/* ========== ACTIONS ========== */
.card-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.action-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-qty {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 13px;
}

.input-qty:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 4px rgba(52, 152, 219, 0.3);
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add {
  background: #27ae60;
  color: white;
}

.btn-add:hover:not(:disabled) {
  background: #229954;
}

.btn-remove {
  background: #e74c3c;
  color: white;
}

.btn-remove:hover:not(:disabled) {
  background: #c0392b;
}

.btn-set {
  background: #3498db;
  color: white;
}

.btn-set:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  padding: 10px 15px;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.card-footer {
  padding-top: 10px;
  border-top: 1px solid #ecf0f1;
  color: #7f8c8d;
}

/* ========== ACTIONS RAPIDES ========== */
.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ========== HISTORIQUE ========== */
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.history-table thead {
  background: #ecf0f1;
  border-bottom: 2px solid #bdc3c7;
}

.history-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
}

.history-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #ecf0f1;
}

.history-table tr.change-positive {
  background: #f0fdf4;
}

.history-table tr.change-negative {
  background: #fef2f2;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  background: #3498db;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge-change {
  margin-left: 5px;
  font-weight: bold;
  color: #2c3e50;
}

/* ========== FEEDBACK ========== */
.feedback {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 6px;
  font-weight: 600;
  animation: slideIn 0.3s ease;
}

.feedback.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.feedback.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========== LOADING ========== */
.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
}

.empty-state {
  background: #f8f9fa;
  border-radius: 6px;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar {
    width: 100%;
  }

  .products-list {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .feedback {
    left: 10px;
    right: 10px;
  }
}
</style>
