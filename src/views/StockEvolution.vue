<template>
  <div class="stock-evolution-container">
    <h2>📈 Évolution du Stock Journalier</h2>
    <p class="subtitle">Historique des changements de stock par jour et par produit</p>

    <!-- Filtres -->
    <div class="section filters-section">
      <div class="filter-group">
        <label for="product-select">Filtrer par produit :</label>
        <select v-model="selectedProduct" class="filter-select">
          <option value="">Tous les produits</option>
          <option v-for="product in allProducts" :key="product" :value="product">
            {{ product }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="date-from">Du :</label>
        <input v-model="dateFrom" type="date" class="filter-input" />
      </div>

      <div class="filter-group">
        <label for="date-to">Au :</label>
        <input v-model="dateTo" type="date" class="filter-input" />
      </div>

      <button @click="applyFilters" class="btn btn-filter">
        🔍 Appliquer filtres
      </button>
    </div>

    <!-- Vue globale: Évolution journalière tous produits -->
    <div class="section">
      <div class="section-header">
        <h3>📊 Résumé Journalier (Tous les produits)</h3>
        <button @click="toggleView('daily')" class="btn btn-toggle" :class="{ active: viewMode === 'daily' }">
          Vue Quotidienne
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Chargement...</p>
      </div>

      <div v-else-if="dailyEvolutionData.length === 0" class="empty-state">
        <p>Aucune donnée de stock disponible.</p>
      </div>

      <div v-else class="daily-evolution-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produits modifiés</th>
              <th>Détail des changements</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(day, index) in dailyEvolutionData" :key="index">
              <td class="date-cell">{{ formatDate(day.date) }}</td>
              <td class="count-cell">{{ day.products.length }}</td>
              <td class="details-cell">
                <div v-for="product in day.products" :key="product.reference" class="product-detail">
                  <strong>{{ product.name }} ({{ product.reference }})</strong>
                  <span class="quantity-change" :class="{ 'positive': product.change > 0, 'negative': product.change < 0 }">
                    {{ product.quantityStart }} → {{ product.quantityEnd }}
                    <span class="badge-change">{{ product.change > 0 ? '+' : '' }}{{ product.change }}</span>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Vue par produit: Évolution journalière -->
    <div v-if="selectedProduct" class="section">
      <div class="section-header">
        <h3>📉 Évolution de {{ selectedProduct }}</h3>
        <button @click="toggleView('product')" class="btn btn-toggle" :class="{ active: viewMode === 'product' }">
          Vue Produit
        </button>
      </div>

      <div v-if="productEvolutionData.length === 0" class="empty-state">
        <p>Aucun historique pour ce produit.</p>
      </div>

      <div v-else class="product-evolution">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Stock Début</th>
              <th>Stock Fin</th>
              <th>Changement</th>
              <th>Détail des mouvements</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(day, index) in productEvolutionData" :key="index">
              <td class="date-cell">{{ formatDate(day.date) }}</td>
              <td class="qty-cell">{{ day.quantityStart }}</td>
              <td class="qty-cell">{{ day.quantityEnd }}</td>
              <td class="change-cell" :class="{ 'positive': day.totalChange > 0, 'negative': day.totalChange < 0 }">
                {{ day.totalChange > 0 ? '+' : '' }}{{ day.totalChange }}
              </td>
              <td class="changes-detail">
                <div v-for="(change, idx) in day.changes" :key="idx" class="change-item">
                  <span class="reason-badge">{{ change.reason }}</span>
                  <span class="change-info">{{ change.change > 0 ? '+' : '' }}{{ change.change }} (→ {{ change.newQuantity }})</span>
                  <span class="time">{{ formatTime(change.timestamp) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Graphique (Optional - pour affichage visuel) -->
    <div v-if="selectedProduct" class="section">
      <div class="section-header">
        <h3>📈 Courbe d'évolution</h3>
      </div>

      <div class="chart-container">
        <div class="simple-chart">
          <div v-for="day in productEvolutionData" :key="day.date" class="chart-bar">
            <div
              class="bar"
              :style="{ height: (day.quantityEnd / maxQuantity * 100) + '%' }"
              :class="{ 'positive': day.totalChange > 0, 'negative': day.totalChange < 0 }"
            >
              <span class="bar-label">{{ day.quantityEnd }}</span>
            </div>
            <span class="bar-date">{{ formatDateShort(day.date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Résumé -->
    <div class="section">
      <div class="section-header">
        <h3>📊 Statistiques</h3>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total jours avec changements</div>
          <div class="stat-value">{{ dailyEvolutionData.length }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Total mouvements de stock</div>
          <div class="stat-value">{{ totalMovements }}</div>
        </div>

        <div v-if="selectedProduct" class="stat-card">
          <div class="stat-label">Stock actuel ({{ selectedProduct }})</div>
          <div class="stat-value">{{ currentProductStock }}</div>
        </div>

        <div v-if="selectedProduct && productEvolutionData.length > 0" class="stat-card">
          <div class="stat-label">Variation totale</div>
          <div class="stat-value" :class="{ 'positive': totalVariation > 0, 'negative': totalVariation < 0 }">
            {{ totalVariation > 0 ? '+' : '' }}{{ totalVariation }}
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="section actions-section">
      <button @click="goToStockManagement" class="btn btn-secondary">
        ← Revenir à la Gestion du Stock
      </button>
      <button @click="exportReport" class="btn btn-secondary">
        📥 Exporter le rapport
      </button>
      <button @click="printReport" class="btn btn-secondary">
        🖨️ Imprimer
      </button>
    </div>
  </div>
</template>

<script>
import { StockService } from '../services/StockService';

export default {
  name: 'StockEvolution',
  data() {
    return {
      loading: false,
      selectedProduct: '',
      viewMode: 'daily',
      dailyEvolutionData: [],
      productEvolutionData: [],
      allProducts: [],
      dateFrom: null,
      dateTo: null
    };
  },
  computed: {
    currentProductStock() {
      if (!this.selectedProduct) return 0;
      return StockService.getStock(this.selectedProduct);
    },

    maxQuantity() {
      if (this.productEvolutionData.length === 0) return 1;
      return Math.max(...this.productEvolutionData.map(d => d.quantityEnd), 1);
    },

    totalMovements() {
      if (this.viewMode === 'daily') {
        return this.dailyEvolutionData.reduce((sum, day) => sum + day.products.length, 0);
      } else if (this.selectedProduct) {
        return this.productEvolutionData.reduce((sum, day) => sum + day.changes.length, 0);
      }
      return 0;
    },

    totalVariation() {
      if (this.productEvolutionData.length === 0) return 0;
      const first = this.productEvolutionData[0];
      const last = this.productEvolutionData[this.productEvolutionData.length - 1];
      return last.quantityEnd - first.quantityStart;
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        StockService.initDB();

        // Charger l'évolution journalière globale
        const dailyAll = StockService.getDailyEvolutionAllProducts();
        this.dailyEvolutionData = dailyAll;

        // Extraire tous les produits
        const allProds = new Set();
        dailyAll.forEach(day => {
          day.products.forEach(p => allProds.add(p.reference));
        });
        this.allProducts = Array.from(allProds).sort();

        // Si pas de produit sélectionné, en sélectionner un par défaut
        if (this.allProducts.length > 0 && !this.selectedProduct) {
          this.selectedProduct = this.allProducts[0];
          this.loadProductEvolution();
        }

        // Initialiser les dates
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        if (!this.dateFrom) {
          this.dateFrom = sevenDaysAgo.toISOString().split('T')[0];
        }
        if (!this.dateTo) {
          this.dateTo = today.toISOString().split('T')[0];
        }

        console.log('✅ Données chargées');
      } catch (error) {
        console.error('❌ Erreur chargement:', error);
      } finally {
        this.loading = false;
      }
    },

    loadProductEvolution() {
      if (!this.selectedProduct) {
        this.productEvolutionData = [];
        return;
      }

      const evolution = StockService.getDailyEvolution(this.selectedProduct);
      this.productEvolutionData = evolution;
    },

    applyFilters() {
      if (this.selectedProduct) {
        this.loadProductEvolution();
      }
      console.log(`Filtres appliqués: ${this.selectedProduct || 'tous'} du ${this.dateFrom} au ${this.dateTo}`);
    },

    toggleView(mode) {
      this.viewMode = mode;
      if (mode === 'product' && !this.selectedProduct && this.allProducts.length > 0) {
        this.selectedProduct = this.allProducts[0];
        this.loadProductEvolution();
      }
    },

    goToStockManagement() {
      this.$emit('navigate', 'stock-management');
      if (this.$router) {
        this.$router.push({ name: 'StockManagement' });
      }
    },

    exportReport() {
      const csv = StockService.exportHistoryToCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `stock-evolution-${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    },

    printReport() {
      window.print();
    },

    formatDate(dateStr) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
      return dateStr;
    },

    formatDateShort(dateStr) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[0]}/${parts[1]}`;
      }
      return dateStr;
    },

    formatTime(isoString) {
      const date = new Date(isoString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  },
  watch: {
    selectedProduct() {
      this.loadProductEvolution();
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>

<style scoped>
.stock-evolution-container {
  max-width: 1400px;
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

/* ========== SECTION ========== */
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

/* ========== FILTRES ========== */
.filters-section {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 13px;
  min-width: 200px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 4px rgba(52, 152, 219, 0.3);
}

/* ========== BOUTONS ========== */
.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-filter {
  background: #3498db;
  color: white;
}

.btn-filter:hover {
  background: #2980b9;
}

.btn-toggle {
  background: #95a5a6;
  color: white;
  padding: 8px 12px;
}

.btn-toggle.active {
  background: #3498db;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  padding: 10px 15px;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

/* ========== TABLES ========== */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: #ecf0f1;
  border-bottom: 2px solid #bdc3c7;
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.date-cell {
  font-weight: 600;
  color: #2c3e50;
  min-width: 120px;
}

.count-cell,
.qty-cell {
  text-align: center;
  font-weight: 600;
}

.change-cell {
  text-align: center;
  font-weight: bold;
  min-width: 80px;
}

.change-cell.positive {
  color: #27ae60;
}

.change-cell.negative {
  color: #e74c3c;
}

.product-detail {
  margin-bottom: 8px;
}

.product-detail strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 4px;
}

.quantity-change {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
}

.quantity-change.positive {
  color: #27ae60;
}

.quantity-change.negative {
  color: #e74c3c;
}

.badge-change {
  margin-left: 8px;
  font-weight: bold;
}

.reason-badge {
  display: inline-block;
  padding: 3px 8px;
  background: #3498db;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 8px;
}

.change-item {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.change-info {
  color: #2c3e50;
  font-weight: 500;
}

.time {
  color: #95a5a6;
  font-size: 11px;
}

.details-cell {
  font-size: 12px;
}

.changes-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ========== GRAPHIQUE ========== */
.chart-container {
  padding: 20px 0;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 15px;
  height: 300px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
  overflow-x: auto;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 60px;
}

.bar {
  width: 40px;
  min-height: 20px;
  background: #3498db;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  transition: all 0.3s;
}

.bar:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.bar.positive {
  background: #27ae60;
}

.bar.negative {
  background: #e74c3c;
}

.bar-label {
  font-size: 11px;
  font-weight: bold;
  color: white;
  padding-bottom: 2px;
}

.bar-date {
  font-size: 11px;
  color: #7f8c8d;
  text-align: center;
  white-space: nowrap;
}

/* ========== STATS ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-card {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.9;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.stat-value.positive {
  color: #2ecc71;
}

.stat-value.negative {
  color: #e74c3c;
}

/* ========== ACTIONS ========== */
.actions-section {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ========== STATES ========== */
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
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select,
  .filter-input {
    min-width: auto;
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
  }

  .simple-chart {
    height: 250px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .actions-section {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media print {
  .section-header,
  .filter-group,
  .actions-section {
    display: none;
  }

  .section {
    page-break-inside: avoid;
  }
}
</style>
