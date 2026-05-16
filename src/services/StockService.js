/**
 * StockService.js
 * Gestion du stock des produits avec historique journalier
 */

const STOCK_DB_KEY = 'prestavue_stock_db';
const STOCK_HISTORY_KEY = 'prestavue_stock_history';

export const StockService = {
  /**
   * Initialise la base de données stock
   */
  initDB() {
    const existing = localStorage.getItem(STOCK_DB_KEY);
    if (!existing) {
      localStorage.setItem(STOCK_DB_KEY, JSON.stringify({}));
      localStorage.setItem(STOCK_HISTORY_KEY, JSON.stringify([]));
      console.log('✅ Base de données stock initialisée');
    }
  },

  /**
   * Obtient le stock d'un produit
   * @param {string} productReference - Référence du produit
   * @returns {number} Quantité en stock
   */
  getStock(productReference) {
    const db = JSON.parse(localStorage.getItem(STOCK_DB_KEY) || '{}');
    return db[productReference] || 0;
  },

  /**
   * Définit le stock d'un produit
   * @param {string} productReference - Référence du produit
   * @param {string} productName - Nom du produit
   * @param {number} quantity - Nouvelle quantité
   * @returns {object} Résultat {success, message, oldQuantity, newQuantity}
   */
  setStock(productReference, productName, quantity) {
    if (quantity < 0) {
      return { success: false, message: 'Quantité ne peut pas être négative' };
    }

    const db = JSON.parse(localStorage.getItem(STOCK_DB_KEY) || '{}');
    const oldQuantity = db[productReference] || 0;
    
    db[productReference] = quantity;
    localStorage.setItem(STOCK_DB_KEY, JSON.stringify(db));

    // Enregistrer dans l'historique
    this._recordStockChange(productReference, productName, oldQuantity, quantity, 'manuel');

    console.log(`✅ Stock ${productReference}: ${oldQuantity} → ${quantity}`);
    return {
      success: true,
      message: `Stock mis à jour: ${oldQuantity} → ${quantity}`,
      oldQuantity,
      newQuantity: quantity
    };
  },

  /**
   * Ajoute de la quantité au stock
   * @param {string} productReference - Référence du produit
   * @param {string} productName - Nom du produit
   * @param {number} quantity - Quantité à ajouter
   * @returns {object} Résultat avec succès et détails
   */
  addStock(productReference, productName, quantity) {
    if (quantity <= 0) {
      return { success: false, message: 'Quantité doit être positive' };
    }

    const db = JSON.parse(localStorage.getItem(STOCK_DB_KEY) || '{}');
    const oldQuantity = db[productReference] || 0;
    const newQuantity = oldQuantity + quantity;
    
    db[productReference] = newQuantity;
    localStorage.setItem(STOCK_DB_KEY, JSON.stringify(db));

    // Enregistrer dans l'historique
    this._recordStockChange(productReference, productName, oldQuantity, newQuantity, 'ajout');

    console.log(`✅ Stock ajouté ${productReference}: +${quantity} (${oldQuantity} → ${newQuantity})`);
    return {
      success: true,
      message: `+${quantity} unité(s) ajoutée(s)`,
      oldQuantity,
      newQuantity,
      quantity: quantity
    };
  },

  /**
   * Retire de la quantité du stock
   * @param {string} productReference - Référence du produit
   * @param {string} productName - Nom du produit
   * @param {number} quantity - Quantité à retirer
   * @returns {object} Résultat avec succès et détails
   */
  removeStock(productReference, productName, quantity) {
    if (quantity <= 0) {
      return { success: false, message: 'Quantité doit être positive' };
    }

    const db = JSON.parse(localStorage.getItem(STOCK_DB_KEY) || '{}');
    const oldQuantity = db[productReference] || 0;

    if (oldQuantity < quantity) {
      return {
        success: false,
        message: `Stock insuffisant: ${oldQuantity} disponible, ${quantity} demandé`
      };
    }

    const newQuantity = oldQuantity - quantity;
    db[productReference] = newQuantity;
    localStorage.setItem(STOCK_DB_KEY, JSON.stringify(db));

    // Enregistrer dans l'historique
    this._recordStockChange(productReference, productName, oldQuantity, newQuantity, 'retrait');

    console.log(`✅ Stock retiré ${productReference}: -${quantity} (${oldQuantity} → ${newQuantity})`);
    return {
      success: true,
      message: `-${quantity} unité(s) retirée(s)`,
      oldQuantity,
      newQuantity,
      quantity: quantity
    };
  },

  /**
   * Obtient tous les stocks
   * @returns {object} Dictionnaire {reference: quantity}
   */
  getAllStocks() {
    return JSON.parse(localStorage.getItem(STOCK_DB_KEY) || '{}');
  },

  /**
   * Enregistre un changement de stock dans l'historique
   * @private
   */
  _recordStockChange(productReference, productName, oldQty, newQty, reason) {
    const history = JSON.parse(localStorage.getItem(STOCK_HISTORY_KEY) || '[]');
    const now = new Date();
    const today = this._getDateKey(now);

    history.push({
      id: `${productReference}_${Date.now()}`,
      reference: productReference,
      name: productName,
      oldQuantity: oldQty,
      newQuantity: newQty,
      change: newQty - oldQty,
      reason: reason, // 'manuel', 'ajout', 'retrait', 'achat'
      timestamp: now.toISOString(),
      date: today
    });

    localStorage.setItem(STOCK_HISTORY_KEY, JSON.stringify(history));
  },

  /**
   * Obtient l'historique complet du stock
   * @returns {array} Liste des changements de stock
   */
  getFullHistory() {
    return JSON.parse(localStorage.getItem(STOCK_HISTORY_KEY) || '[]');
  },

  /**
   * Obtient l'évolution du stock pour un produit spécifique
   * @param {string} productReference - Référence du produit
   * @returns {array} Historique filtré pour ce produit
   */
  getProductHistory(productReference) {
    const history = JSON.parse(localStorage.getItem(STOCK_HISTORY_KEY) || '[]');
    return history
      .filter(h => h.reference === productReference)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  /**
   * Obtient l'évolution du stock journalière pour un produit
   * @param {string} productReference - Référence du produit
   * @returns {array} Résumé par jour {date, quantityStart, quantityEnd, changes}
   */
  getDailyEvolution(productReference) {
    const history = this.getProductHistory(productReference);
    const dailyMap = new Map();

    // Initialiser avec la première quantité
    let runningQuantity = 0;
    const firstEntry = history[0];
    if (firstEntry) {
      runningQuantity = firstEntry.oldQuantity;
    }

    history.forEach((entry, index) => {
      const day = entry.date;
      
      if (!dailyMap.has(day)) {
        dailyMap.set(day, {
          date: day,
          quantityStart: entry.oldQuantity,
          quantityEnd: entry.newQuantity,
          changes: [],
          totalChange: 0
        });
      }

      const dayData = dailyMap.get(day);
      dayData.changes.push({
        reason: entry.reason,
        change: entry.change,
        timestamp: entry.timestamp,
        newQuantity: entry.newQuantity
      });
      dayData.totalChange += entry.change;
      dayData.quantityEnd = entry.newQuantity;
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Obtient l'évolution journalière de tous les produits
   * @returns {object} {date: {reference: {start, end, change}}}
   */
  getDailyEvolutionAllProducts() {
    const history = JSON.parse(localStorage.getItem(STOCK_HISTORY_KEY) || '[]');
    const dailyMap = new Map();

    history.forEach(entry => {
      const day = entry.date;
      
      if (!dailyMap.has(day)) {
        dailyMap.set(day, {});
      }

      const dayData = dailyMap.get(day);
      if (!dayData[entry.reference]) {
        dayData[entry.reference] = {
          reference: entry.reference,
          name: entry.name,
          quantityStart: entry.oldQuantity,
          quantityEnd: entry.newQuantity,
          change: entry.change
        };
      } else {
        dayData[entry.reference].quantityEnd = entry.newQuantity;
        dayData[entry.reference].change += entry.change;
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, products]) => ({
        date,
        products: Object.values(products)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Génère un rapport de stock actuel
   * @returns {array} Rapport avec tous les produits et leurs stocks
   */
  generateStockReport() {
    const stocks = this.getAllStocks();
    const history = JSON.parse(localStorage.getItem(STOCK_HISTORY_KEY) || '[]');

    return Object.entries(stocks).map(([reference, quantity]) => {
      const productHistory = history.filter(h => h.reference === reference);
      const lastEntry = productHistory[productHistory.length - 1];

      return {
        reference,
        name: lastEntry?.name || 'Produit inconnu',
        currentQuantity: quantity,
        totalMovements: productHistory.length,
        lastUpdate: lastEntry?.timestamp || null,
        lastReason: lastEntry?.reason || null
      };
    });
  },

  /**
   * Exporte l'historique en CSV
   * @returns {string} Contenu CSV
   */
  exportHistoryToCSV() {
    const history = this.getFullHistory();
    const headers = ['Date', 'Référence', 'Nom', 'Ancienne Quantité', 'Nouvelle Quantité', 'Changement', 'Raison'];
    const rows = history.map(h => [
      new Date(h.timestamp).toLocaleString('fr-FR'),
      h.reference,
      h.name,
      h.oldQuantity,
      h.newQuantity,
      h.change,
      h.reason
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  },

  /**
   * Efface tout l'historique (usage à risque)
   */
  clearHistory() {
    localStorage.setItem(STOCK_HISTORY_KEY, JSON.stringify([]));
    console.warn('⚠️ Historique du stock effacé');
  },

  /**
   * Efface le stock et l'historique (réinitialisation complète)
   */
  resetAll() {
    localStorage.removeItem(STOCK_DB_KEY);
    localStorage.removeItem(STOCK_HISTORY_KEY);
    console.warn('⚠️ Base de données stock réinitialisée');
    this.initDB();
  },

  /**
   * Utilitaire: Formate une date au format DD/MM/YYYY
   * @private
   */
  _getDateKey(date = new Date()) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
};
