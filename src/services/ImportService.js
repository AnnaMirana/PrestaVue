import { ApiService } from './ApiService';
import { OrderStateService } from './OrderStateService';

// ========== VALIDATION INTELLIGENTE AVEC CORRECTION AUTO ==========
const SmartValidation = {
  // ✅ Validation des noms de colonnes requis
  validateColumnNames(headers, requiredColumns) {
    const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));
    const missingColumns = requiredColumns.filter(col => !headerSet.has(col.toLowerCase()));
    
    if (missingColumns.length > 0) {
      console.error(`❌ COLONNES MANQUANTES: ${missingColumns.join(', ')}`);
      console.error(`   Colonnes trouvées: ${headers.join(', ')}`);
      return {
        valid: false,
        missingColumns,
        message: `Colonnes requises manquantes: ${missingColumns.join(', ')}`
      };
    }
    
    return { valid: true, missingColumns: [] };
  },

  // ✅ Validation du format de date DD/MM/YYYY
  validateDateFormat(dateStr, fieldName = 'date') {
    if (!dateStr) return { valid: false, message: `${fieldName} vide`, value: null };
    
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.trim().match(dateRegex);
    
    if (!match) {
      return {
        valid: false,
        message: `${fieldName} doit être au format DD/MM/YYYY, reçu: ${dateStr}`,
        value: null
      };
    }
    
    const [, day, month, year] = match.map(Number);
    
    // Vérifier les limites des mois et jours
    if (month < 1 || month > 12) {
      return { valid: false, message: `Mois invalide: ${month}`, value: null };
    }
    
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maxDay = daysInMonth[month - 1];
    
    if (day < 1 || day > maxDay) {
      return { valid: false, message: `Jour invalide pour mois ${month}: ${day}`, value: null };
    }
    
    return { valid: true, message: null, value: dateStr };
  },

  // ✅ Validation que le montant est positif
  validatePositiveAmount(amountStr, fieldName = 'montant') {
    if (!amountStr && amountStr !== 0) return { valid: false, message: `${fieldName} vide`, value: null };
    
    // Nettoyer le montant (enlever € et espaces)
    let cleaned = String(amountStr)
      .replace(/€/g, '')
      .replace(/\s+/g, '')
      .replace(',', '.')
      .trim();
    
    const amount = parseFloat(cleaned);
    
    if (isNaN(amount)) {
      return { valid: false, message: `${fieldName} invalide: ${amountStr}`, value: null };
    }
    
    if (amount < 0) {
      return { valid: false, message: `${fieldName} doit être positif: ${amount}`, value: null };
    }
    
    return { valid: true, message: null, value: amount.toFixed(2) };
  },

  // Normalisation des états (correction automatique)
  normalizeState(state) {
    if (!state) return null;
    
    const mapping = {
      'dans le panier': 'dans le panier',
      'en attente paiement à la livraison': 'dans le panier',
      'attente paiement livraison': 'dans le panier',
      'pending delivery': 'dans le panier',
      'panier': 'dans le panier',
      'cart': 'dans le panier',
      'paiement effectué': 'paiement effectué',
      'paiement accepté': 'paiement effectué',
      'paid': 'paiement effectué',
      'payé': 'paiement effectué',
      'validé': 'paiement effectué',
      'annulé': 'annulé',
      'canceled': 'annulé',
      'cancelled': 'annulé',
      'erreur de paiement': 'annulé',
      'error': 'annulé'
    };
    
    const normalized = mapping[state.toLowerCase().trim()];
    if (normalized && normalized !== state) {
      console.log(`  🔧 État corrigé: "${state}" → "${normalized}"`);
    }
    return normalized || state;
  },

  // Normalisation des emails (correction auto - sans caractères invalides)
  normalizeEmail(email, existingEmails = new Set(), strategy = 'suffix') {
    if (!email) return null;
    
    let cleanEmail = email.toLowerCase().trim();
    
    if (existingEmails.has(cleanEmail)) {
      if (strategy === 'skip') {
        console.log(`  ⏭️ Email dupliqué ignoré: "${cleanEmail}"`);
        return null;
      } else if (strategy === 'suffix') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const newEmail = cleanEmail.replace('@', `.dup${timestamp}${random}@`);
        console.log(`  🔧 Email dupliqué corrigé (suffixe): "${cleanEmail}" → "${newEmail}"`);
        return newEmail;
      } else if (strategy === 'update') {
        console.log(`  🔄 Email dupliqué: mise à jour de l'existant "${cleanEmail}"`);
        return cleanEmail;
      }
    }
    
    existingEmails.add(cleanEmail);
    return cleanEmail;
  },

  // Parsing flexible des achats (multi-formats)
  parseAchatFlexible(achatStr) {
    if (!achatStr || achatStr === '[]' || achatStr === '') return [];
    
    // Format 1: JSON standard
    try {
      const parsed = JSON.parse(achatStr);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    
    // Format 2: Nettoyage des doubles guillemets
    let cleaned = achatStr.replace(/""/g, '"');
    
    // Format 3: [("T_01";3;"ngoza")]
    const pattern = /\(["']?([^"',;]+)["']?[;,]([0-9]+)[;,]["']?([^"')]*)["']?\)/g;
    const items = [];
    let match;
    
    while ((match = pattern.exec(cleaned)) !== null) {
      items.push({
        reference: match[1].trim(),
        quantity: parseInt(match[2]),
        attribute: match[3]?.trim() || null
      });
    }
    
    // Format 4: [{'reference':'T_01','quantity':3}]
    if (items.length === 0 && achatStr.includes('{')) {
      try {
        const jsonStr = achatStr.replace(/'/g, '"');
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) return parsed;
      } catch(e) {}
    }
    
    if (items.length > 0) {
      console.log(`  🔧 Achat parsé: ${items.length} article(s)`);
      return items;
    }
    
    console.warn(`  ⚠️ Format d'achat non reconnu: ${achatStr.substring(0, 50)}...`);
    return [];
  },

  // Normalisation des prix
  normalizePrice(priceStr, defaultValue = '0.00') {
    if (!priceStr && priceStr !== 0) return defaultValue;
    
    let cleaned = String(priceStr)
      .replace(/€/g, '')
      .replace(/\s+/g, '')
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.');
    
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts[parts.length - 1];
    }
    
    const numPrice = parseFloat(cleaned);
    if (isNaN(numPrice) || numPrice < 0) {
      console.log(`  🔧 Prix corrigé: "${priceStr}" → ${defaultValue}€`);
      return defaultValue;
    }
    
    return numPrice.toFixed(2);
  },

  // Validation avec correction automatique pour les produits
  validateAndFixProduct(row, index) {
    const errors = [];
    const corrections = [];
    const fixedRow = { ...row };
    
    if (!fixedRow.nom || !fixedRow.nom.trim()) {
      fixedRow.nom = `Produit_${index + 1}`;
      corrections.push(`Nom manquant → "${fixedRow.nom}"`);
    }
    
    if (!fixedRow.reference || !fixedRow.reference.trim()) {
      fixedRow.reference = `REF_${Date.now()}_${index}`;
      corrections.push(`Référence manquante → "${fixedRow.reference}"`);
    }
    
    // ✅ Valider le format de date si présente
    if (fixedRow.date_availability_produit) {
      const dateCheck = this.validateDateFormat(fixedRow.date_availability_produit, 'date_availability_produit');
      if (!dateCheck.valid) {
        errors.push(dateCheck.message);
      }
    }
    
    // ✅ Valider le prix (montant positif)
    const priceCheck = this.validatePositiveAmount(fixedRow.prix_ttc, 'prix_ttc');
    if (!priceCheck.valid) {
      errors.push(priceCheck.message);
    } else {
      const originalPrice = fixedRow.prix_ttc;
      fixedRow.prix_ttc = priceCheck.value;
      if (originalPrice !== fixedRow.prix_ttc) {
        corrections.push(`Prix "${originalPrice}" → ${fixedRow.prix_ttc}€`);
      }
    }

    // ✅ Valider le prix d'achat si présent
    if (fixedRow.prix_achat) {
      const costCheck = this.validatePositiveAmount(fixedRow.prix_achat, 'prix_achat');
      if (!costCheck.valid) {
        errors.push(costCheck.message);
      } else {
        fixedRow.prix_achat = costCheck.value;
      }
    }
    
    if (fixedRow.taille || fixedRow.couleur || fixedRow.karazany || fixedRow.specificité) {
      const attrs = [fixedRow.taille, fixedRow.couleur, fixedRow.karazany, fixedRow.specificité].filter(Boolean);
      console.log(`  ℹ️ Déclinaison ignorée pour ${fixedRow.reference}: ${attrs.join(', ')}`);
    }
    
    return { valid: errors.length === 0, errors, corrections, data: fixedRow };
  },

  // Validation avec correction automatique pour les clients
  validateAndFixClient(row, index, existingEmails, strategy = 'suffix') {
    const errors = [];
    const corrections = [];
    const fixedRow = { ...row };
    
    if (!fixedRow.email || !fixedRow.email.trim()) {
      fixedRow.email = `client_${Date.now()}_${index}@temp.local`;
      corrections.push(`Email manquant → "${fixedRow.email}"`);
    } else {
      const originalEmail = fixedRow.email;
      const newEmail = this.normalizeEmail(fixedRow.email, existingEmails, strategy);
      if (newEmail === null) {
        errors.push(`Email dupliqué ignoré: ${fixedRow.email}`);
      } else if (newEmail !== originalEmail) {
        fixedRow.email = newEmail;
        corrections.push(`Email "${originalEmail}" → "${fixedRow.email}"`);
      }
    }
    
    if (!fixedRow.nom || !fixedRow.nom.trim()) {
      fixedRow.nom = `Client_${index + 1}`;
      corrections.push(`Nom manquant → "${fixedRow.nom}"`);
    }
    
    if (!fixedRow.prenom || !fixedRow.prenom.trim()) {
      fixedRow.prenom = "Client";
      corrections.push(`Prénom manquant → "${fixedRow.prenom}"`);
    }
    
    if (!fixedRow.pwd || !fixedRow.pwd.trim()) {
      fixedRow.pwd = "password123";
      corrections.push(`Mot de passe par défaut`);
    }
    
    if (!fixedRow.adresse || !fixedRow.adresse.trim()) {
      fixedRow.adresse = "Adresse non renseignée";
      corrections.push(`Adresse par défaut`);
    }
    
    return { valid: errors.length === 0, errors, corrections, data: fixedRow };
  },

  // Vérifier si un email existe déjà dans PrestaShop
  async emailExistsInPrestashop(email) {
    try {
      const xml = await ApiService.get(`customers?filter[email]=${encodeURIComponent(email)}`);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const customers = xmlDoc.getElementsByTagName('customer');
      return customers.length > 0;
    } catch (error) {
      console.warn(`⚠️ Erreur vérification email ${email}:`, error.message);
      return false;
    }
  }
};

// ========== UTILITAIRES ==========
const PriceUtils = {
  cleanPrice(priceStr) {
    return SmartValidation.normalizePrice(priceStr, '0.00');
  },

  calculateTotal(achatStr) {
    try {
      const items = SmartValidation.parseAchatFlexible(achatStr);
      if (items.length === 0) return '0.00';
      
      const total = items.reduce((sum, item) => {
        const price = parseFloat(item.price || item.prix || 10);
        const qty = parseInt(item.quantity || item.qty || 1, 10);
        return sum + (price * qty);
      }, 0);
      
      return total.toFixed(2);
    } catch (e) {
      console.warn('Erreur calcul total:', e);
      return '0.00';
    }
  }
};

// ========== UTILITAIRES API ROBUSTES ==========
const ApiUtils = {
  // Signature flexible : accepte PUT/DELETE avec id séparé
  async callApiWithTimeout(method, endpoint, idOrData, dataOrTimeout, maybeTimeout) {
    const controller = new AbortController();
    
    let actualData, actualTimeout, id;
    
    // Détermine les vrais paramètres selon la méthode
    if (method === 'put' || method === 'delete') {
      // Pour PUT/DELETE: (method, endpoint, id, data, timeout)
      id = idOrData;
      actualData = dataOrTimeout;
      actualTimeout = maybeTimeout || 10000;
    } else {
      // Pour POST/GET: (method, endpoint, data, timeout)
      actualData = idOrData;
      actualTimeout = dataOrTimeout || 10000;
      id = null;
    }
    
    const timeoutId = setTimeout(() => controller.abort(), actualTimeout);
    
    try {
      let response;
      if (id !== null) {
        // PUT ou DELETE avec id
        response = await ApiService[method](endpoint, id, actualData, { signal: controller.signal });
      } else {
        // POST ou GET
        response = await ApiService[method](endpoint, actualData, { signal: controller.signal });
      }
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout API après ${actualTimeout}ms pour ${endpoint}`);
      }
      throw error;
    }
  },

  _extractId(xml) {
    if (!xml) return null;
    const match = xml.match(/<id><!\[CDATA\[(\d+)\]\]><\/id>/) || xml.match(/<id>(\d+)<\/id>/);
    return match ? match[1] : null;
  }
};

// ========== SERVICE D'IMPORT ==========
export const ImportService = {
  // Configuration
  _config: {
    strictMode: false,
    interactiveMode: true,
    duplicateStrategy: 'suffix',
    onError: null
  },

  importState: {
    productsCount: 0,
    customersCount: 0,
    ordersCount: 0,
    errors: [],
    warnings: [],
    corrections: []
  },

  setConfig(config) {
    this._config = { ...this._config, ...config };
    console.log('⚙️ Configuration import mise à jour:', this._config);
  },

  getConfig() {
    return this._config;
  },

  // 1. FONCTION MAÎTRESSE
  async processGlobalImport(files) {
    this.importState = { 
      productsCount: 0, 
      customersCount: 0, 
      ordersCount: 0, 
      errors: [],
      warnings: [],
      corrections: []
    };
    
    console.log("\n" + "=".repeat(70));
    console.log("📋 === DÉBUT IMPORT GLOBAL (Mode Adaptatif) ===");
    console.log("=".repeat(70));
    
    const startTime = Date.now();

    try {
      if (files.produits && files.produits.length > 0) {
        await this.importProductsAndCategories(files.produits);
      }

      if (files.details && files.details.length > 0) {
        await this.updateProductsDetails(files.details);
      }

      if (files.images) {
        await this.importImages(files.images).catch(e => {
          console.warn("⚠️ Images non traitées:", e.message);
        });
      }

      if (files.clients && files.clients.length > 0) {
        await this.importFullCustomerWorkflow(files.clients);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log("\n" + "=".repeat(70));
      console.log("📊 RÉSUMÉ FINAL");
      console.log("=".repeat(70));
      console.log(`✅ Durée: ${duration}s`);
      console.log(`  • Produits: ${this.importState.productsCount}`);
      console.log(`  • Clients: ${this.importState.customersCount}`);
      console.log(`  • Commandes: ${this.importState.ordersCount}`);
      
      if (this.importState.corrections.length) {
        console.log(`\n🔧 Corrections appliquées (${this.importState.corrections.length}):`);
        this.importState.corrections.slice(0, 10).forEach(c => console.log(`  • ${c}`));
        if (this.importState.corrections.length > 10) {
          console.log(`  ... et ${this.importState.corrections.length - 10} autres`);
        }
      }
      
      if (this.importState.errors.length) {
        console.log(`\n⚠️ Erreurs (${this.importState.errors.length}):`);
        this.importState.errors.slice(0, 10).forEach(e => console.log(`  • ${e}`));
      }

      return {
        success: true,
        message: `Import terminé: ${this.importState.productsCount} produits, ${this.importState.customersCount} clients, ${this.importState.ordersCount} commandes`,
        stats: {
          products: this.importState.productsCount,
          customers: this.importState.customersCount,
          orders: this.importState.ordersCount,
          errors: this.importState.errors.length,
          corrections: this.importState.corrections.length,
          duration: duration
        }
      };

    } catch (fatalError) {
      console.error("❌ ERREUR FATALE:", fatalError);
      return {
        success: false,
        message: `Erreur fatale: ${fatalError.message}`,
        stats: this.importState
      };
    }
  },

  // 2. PRODUITS & CATÉGORIES
  async importProductsAndCategories(rows) {
    console.log(`\n📦 === IMPORT PRODUITS === (${rows.length} lignes)`);
    
    // ✅ Vérifier les colonnes requises
    if (rows.length === 0) {
      console.warn("⚠️ Aucune ligne à importer");
      return;
    }
    
    const requiredColumns = ['nom', 'reference', 'prix_ttc'];
    const headers = Object.keys(rows[0]);
    const columnCheck = SmartValidation.validateColumnNames(headers, requiredColumns);
    
    if (!columnCheck.valid) {
      console.error(`❌ ERREUR: ${columnCheck.message}`);
      this.importState.errors.push(`Import produits: ${columnCheck.message}`);
      return;
    }
    
    console.log(`✅ Colonnes valides: ${headers.join(', ')}`);
    
    let successCount = 0;
    let skipCount = 0;
    const existingRefs = new Set();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const { valid, errors, corrections, data } = SmartValidation.validateAndFixProduct(row, i);
      
      if (corrections.length) {
        this.importState.corrections.push(`Produit L${i+1}: ${corrections.join(', ')}`);
      }
      
      if (!valid) {
        console.warn(`❌ Produit ligne ${i+1} ignoré:`, errors.join(', '));
        this.importState.errors.push(`Produit L${i+1}: ${errors.join(', ')}`);
        skipCount++;
        continue;
      }

      if (existingRefs.has(data.reference)) {
        console.warn(`⚠️ Référence dupliquée: ${data.reference} (ligne ${i+1} ignorée)`);
        this.importState.errors.push(`Produit L${i+1}: Référence dupliquée "${data.reference}"`);
        skipCount++;
        continue;
      }
      existingRefs.add(data.reference);

      try {
        const catName = data.categorie || "Accueil";
        try {
          const catXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <category>
    <name><language id="1"><![CDATA[${catName}]]></language></name>
    <active>1</active>
    <link_rewrite><language id="1"><![CDATA[${catName.toLowerCase().replace(/\s+/g, '-')}]]></language></link_rewrite>
  </category>
</prestashop>`;
          await ApiUtils.callApiWithTimeout('post', 'categories', catXml, 5000);
        } catch (e) {
          console.warn(`  ⚠️ Catégorie "${catName}" existe peut-être déjà`);
        }

        const cleanPrice = PriceUtils.cleanPrice(data.prix_ttc);
        const linkRewrite = data.nom.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        
        const prodXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <product>
    <name><language id="1"><![CDATA[${data.nom}]]></language></name>
    <reference><![CDATA[${data.reference}]]></reference>
    <price>${cleanPrice}</price>
    <active>1</active>
    <state>1</state>
    <id_category_default>2</id_category_default>
    <link_rewrite><language id="1"><![CDATA[${linkRewrite}]]></language></link_rewrite>
  </product>
</prestashop>`;
        
        await ApiUtils.callApiWithTimeout('post', 'products', prodXml, 5000);
        this.importState.productsCount++;
        successCount++;
        console.log(`  ✓ "${data.nom}" [${data.reference}] ${cleanPrice}€`);

      } catch (error) {
        console.error(`  ❌ Erreur: ${error.message}`);
        this.importState.errors.push(`Produit [${data.reference}]: ${error.message}`);
        skipCount++;
      }
    }
    
    console.log(`✅ Résumé: ${successCount} importé(s), ${skipCount} ignoré(s)`);
  },

  // 3. MISE À JOUR DÉTAILS
  async updateProductsDetails(rows) {
    console.log(`\n⚙️ === MISE À JOUR DÉTAILS ===`);
    let updatedCount = 0;
    const productsMap = new Map();
    
    try {
      const xml = await ApiService.get('products?display=[id,reference]');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const products = xmlDoc.getElementsByTagName('product');
      
      for (let i = 0; i < products.length; i++) {
        const id = products[i].getElementsByTagName('id')[0]?.textContent;
        const ref = products[i].getElementsByTagName('reference')[0]?.textContent;
        if (id && ref) productsMap.set(ref, id);
      }
    } catch (e) {
      console.warn("⚠️ Impossible de récupérer les produits existants");
    }
    
    for (const row of rows) {
      const reference = row.reference;
      if (!reference) {
        console.warn(`⚠️ Ligne sans référence ignorée`);
        continue;
      }
      
      // On ignore les déclinaisons mais on log
      if (row.taille || row.couleur || row.karazany || row.specificité) {
        console.log(`  ℹ️ Déclinaison ignorée: ${reference} - ${row.taille || row.karazany || row.specificité}`);
        continue;
      }
      
      const productId = productsMap.get(reference);
      if (!productId) {
        console.warn(`  ⚠️ Produit non trouvé: ${reference}`);
        continue;
      }
      
      try {
        const cleanPrice = PriceUtils.cleanPrice(row.prix_vente_ttc);
        
        const updateXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <product>
    <id>${productId}</id>
    <price>${cleanPrice}</price>
  </product>
</prestashop>`;
        
        console.log(`  📝 Mise à jour ${reference}: ${cleanPrice}€`);
        await ApiUtils.callApiWithTimeout('put', 'products', productId, updateXml, 5000);
        
        updatedCount++;
        console.log(`  ✓ ${reference}: prix mis à jour → ${cleanPrice}€`);
        
      } catch (error) {
        console.warn(`  ⚠️ Erreur mise à jour ${reference}:`, error.message);
        this.importState.errors.push(`Mise à jour ${reference}: ${error.message}`);
      }
    }
    
    console.log(`✅ ${updatedCount} produit(s) mis à jour`);
  },

  // 4. IMAGES
  async importImages(zipFile) {
    console.log(`\n🖼️ === TRAITEMENT ZIP ===`);
    console.log(`📦 ${zipFile.name} - À dézipper et associer aux produits`);
    return { success: true };
  },

  // 5. WORKFLOW CLIENTS & COMMANDES
  async importFullCustomerWorkflow(rows) {
    console.log(`\n👥 === IMPORT CLIENTS ET COMMANDES === (${rows.length} lignes)`);
    let clientSuccessCount = 0;
    let orderSuccessCount = 0;
    let skipCount = 0;
    const existingEmails = new Set();
    
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      let customerId = null;
      let addressId = null;

      try {
        const { valid, corrections, data: row } = SmartValidation.validateAndFixClient(
          rawRow, i, existingEmails, this._config.duplicateStrategy
        );
        
        if (!valid) {
          console.warn(`❌ Client ligne ${i+1} ignoré: validation échouée`);
          this.importState.errors.push(`Client L${i+1}: validation échouée`);
          skipCount++;
          continue;
        }
        
        if (corrections.length) {
          this.importState.corrections.push(`Client L${i+1}: ${corrections.join(', ')}`);
        }

        // Vérifier si l'email existe déjà dans PrestaShop
        const emailExists = await SmartValidation.emailExistsInPrestashop(row.email);
        
        if (emailExists && this._config.duplicateStrategy === 'update') {
          // Récupérer l'ID du client existant
          console.log(`  🔄 Email existe déjà, mise à jour du client: ${row.email}`);
          
          const existingCustomerXml = await ApiService.get(`customers?filter[email]=${encodeURIComponent(row.email)}`);
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(existingCustomerXml, 'text/xml');
          
          let existingId = null;
          const customerEl = xmlDoc.getElementsByTagName('customer')[0];
          if (customerEl) {
            existingId = customerEl.getElementsByTagName('id')[0]?.textContent;
          }
          if (!existingId) {
            existingId = xmlDoc.getElementsByTagName('id')[0]?.textContent;
          }
          
          console.log(`  🔍 Email ${row.email} → ID trouvé: ${existingId || 'non trouvé'}`);
          
          if (existingId) {
            customerId = existingId;
            
            const updateXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <customer>
    <id>${customerId}</id>
    <lastname><![CDATA[${row.nom || 'Client'}]]></lastname>
    <firstname><![CDATA[${row.prenom || 'Client'}]]></firstname>
    <passwd><![CDATA[${row.pwd || 'password123'}]]></passwd>
    <active>1</active>
  </customer>
</prestashop>`;
            await ApiUtils.callApiWithTimeout('put', 'customers', customerId, updateXml, 5000);
            console.log(`  ✓ Client mis à jour: ${row.prenom} ${row.nom} [${row.email}] (ID: ${customerId})`);
          } else {
            throw new Error("ID client non trouvé dans la réponse");
          }
        } else if (!emailExists) {
          // Créer un nouveau client
          const firstname = row.prenom || "Client";
          const lastname = row.nom || "Test";
          const customerXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <customer>
    <lastname><![CDATA[${lastname}]]></lastname>
    <firstname><![CDATA[${firstname}]]></firstname>
    <email><![CDATA[${row.email}]]></email>
    <passwd><![CDATA[${row.pwd || 'password123'}]]></passwd>
    <active>1</active>
  </customer>
</prestashop>`;
          
          const resCust = await ApiUtils.callApiWithTimeout('post', 'customers', customerXml, 5000);
          customerId = ApiUtils._extractId(resCust.text);
          console.log(`  ✓ Client créé: ${firstname} ${lastname} [${row.email}] (ID: ${customerId})`);
        } else {
          console.warn(`  ⚠️ Client ignoré (doublon): ${row.email}`);
          skipCount++;
          continue;
        }
        
        if (!customerId) {
          throw new Error("ID client non extrait");
        }
        
        this.importState.customersCount++;
        clientSuccessCount++;

        // Créer l'adresse
        const addrXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <address>
    <id_customer>${customerId}</id_customer>
    <id_country>8</id_country>
    <alias><![CDATA[Adresse principale]]></alias>
    <lastname><![CDATA[${row.nom || 'Client'}]]></lastname>
    <firstname><![CDATA[${row.prenom || 'Client'}]]></firstname>
    <address1><![CDATA[${row.adresse || 'Adresse par défaut'}]]></address1>
    <city><![CDATA[${row.ville || 'Antananarivo'}]]></city>
    <postcode><![CDATA[${row.codepostal || '101'}]]></postcode>
  </address>
</prestashop>`;
      
        const resAddr = await ApiUtils.callApiWithTimeout('post', 'addresses', addrXml, 5000);
        addressId = ApiUtils._extractId(resAddr.text);
        console.log(`    📍 Adresse créée (ID: ${addressId})`);

        // 🔥 CRÉATION DE COMMANDE (TOUJOURS, PAS DE PANIER)
        if (row.achat && row.achat !== '[]' && row.achat !== '') {
          const rawState = row.statut || row.état;
          const normalizedState = SmartValidation.normalizeState(rawState);
          const stateId = OrderStateService.mapFromInput(normalizedState || 'dans le panier');
          
          await this.createOrderWithState(customerId, addressId, row.achat, stateId);
          orderSuccessCount++;
        }

      } catch (error) {
        console.error(`  ❌ Erreur: ${error.message}`);
        this.importState.errors.push(`Client ${rawRow.email || `ligne ${i+1}`}: ${error.message}`);
        skipCount++;
      }
    }
    
    console.log(`✅ Résumé: ${clientSuccessCount} client(s), ${orderSuccessCount} commande(s), ${skipCount} ignoré(s)`);
  },

  // 🔥 CRÉATION COMMANDE (TOUJOURS, PAS DE PANIER)
  async createOrderWithState(customerId, addressId, achatStr, stateId) {
    try {
      const items = SmartValidation.parseAchatFlexible(achatStr);
      const totalPaid = items.length * 10; // Prix par défaut simplifié
      
      // 1. Créer le panier (obligatoire pour créer une commande)
      const cartXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <cart>
    <id_customer>${customerId}</id_customer>
    <id_currency>1</id_currency>
    <id_lang>1</id_lang>
  </cart>
</prestashop>`;
      
      const resCart = await ApiUtils.callApiWithTimeout('post', 'carts', cartXml, 5000);
      const cartId = ApiUtils._extractId(resCart.text);
      
      // 2. Déterminer l'état PrestaShop
      let prestashopStateId = 2; // Par défaut: "Paiement accepté"
      let stateLabel = "Validée";
      
      if (stateId === OrderStateService.STATES?.CART || stateId === 1) {
        prestashopStateId = 2; // "dans le panier" → "Paiement accepté"
        stateLabel = "Validée (ex-panier)";
      } else if (stateId === OrderStateService.STATES?.PAID || stateId === 2) {
        prestashopStateId = 2; // "paiement effectué" → "Paiement accepté"
        stateLabel = "Payée";
      } else if (stateId === OrderStateService.STATES?.CANCELLED || stateId === 3) {
        prestashopStateId = 6; // "annulé" → "Annulé"
        stateLabel = "Annulée";
      }
      
      // 3. Créer la commande
      const orderXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <order>
    <id_customer>${customerId}</id_customer>
    <id_address_delivery>${addressId}</id_address_delivery>
    <id_address_invoice>${addressId}</id_address_invoice>
    <id_cart>${cartId}</id_cart>
    <id_currency>1</id_currency>
    <id_lang>1</id_lang>
    <id_carrier>1</id_carrier>
    <current_state>${prestashopStateId}</current_state>
    <payment><![CDATA[Paiement à la livraison]]></payment>
    <total_paid>${totalPaid}</total_paid>
    <total_products_wt>${totalPaid}</total_products_wt>
  </order>
</prestashop>`;
      
      const resOrder = await ApiUtils.callApiWithTimeout('post', 'orders', orderXml, 5000);
      const orderId = ApiUtils._extractId(resOrder.text);
      this.importState.ordersCount++;
      console.log(`    ✅ COMMANDE ${stateLabel} (ID: ${orderId}) - Total: ${totalPaid}€`);
      
    } catch (error) {
      console.error("  ❌ Erreur création commande:", error.message);
      throw error;
    }
  }
};