<template>
  <div class="backoffice-layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>PrestaVue</h2>
        <span>ITU Madagascar - P17</span>
      </div>
      <nav>
        <button :class="{ active: view === 'import' }" @click="view = 'import'">📥 Import Global</button>
        <button :class="{ active: view === 'reset' }" @click="view = 'reset'">🗑️ Réinitialisation</button>
        <button :class="{ active: view === 'dashboard' }" @click="view = 'dashboard'">📊 Dashboard</button>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;">
        <button :class="{ active: view === 'stock-management' }" @click="view = 'stock-management'">📦 Gestion Stock</button>
        <button :class="{ active: view === 'stock-evolution' }" @click="view = 'stock-evolution'">📈 Évolution Stock</button>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;">
        <button @click="handleVisitShop" class="btn-shop">🛍️ Voir la boutique</button>
        <button @click="handleLogout" class="btn-logout">🔓 Déconnexion</button>
      </nav>
    </aside>

    <main class="content">
      <!-- Vue Import -->
      <div v-if="view === 'import'" class="view-container">
        <h1>📥 Importation Globale</h1>
        <p class="subtitle">Chargez vos fichiers CSV/ZIP pour synchroniser avec PrestaShop</p>

        <!-- Configuration de l'import -->
        <div class="config-card">
          <div class="config-header" @click="showConfig = !showConfig">
            <h3>⚙️ Options d'import avancées</h3>
            <span class="toggle-icon">{{ showConfig ? '▼' : '▶' }}</span>
          </div>
          
          <div v-show="showConfig" class="config-body">
            <div class="config-section">
              <h4>📋 Stratégies globales</h4>
              <div class="config-row">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="importConfig.interactiveMode">
                  Mode interactif (demander confirmation pour les erreurs)
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="importConfig.strictMode">
                  Mode strict (stopper à la première erreur)
                </label>
              </div>
            </div>

            <div class="config-section">
              <h4>🔧 Gestion des erreurs</h4>
              <div class="config-grid">
                <div class="config-field">
                  <label>Email dupliqué :</label>
                  <select v-model="importConfig.errorHandling.duplicate_email">
                    <option value="skip">Ignorer</option>
                    <option value="update">Mettre à jour</option>
                    <option value="suffix">Ajouter suffixe</option>
                    <option value="ask">Demander</option>
                  </select>
                </div>
                
                <div class="config-field">
                  <label>État invalide :</label>
                  <select v-model="importConfig.errorHandling.invalid_state">
                    <option value="auto_fix">Corriger auto</option>
                    <option value="skip">Ignorer ligne</option>
                    <option value="ask">Demander</option>
                  </select>
                </div>
                
                <div class="config-field">
                  <label>Prix invalide :</label>
                  <select v-model="importConfig.errorHandling.invalid_price">
                    <option value="default_zero">Mettre à 0</option>
                    <option value="skip">Ignorer ligne</option>
                    <option value="ask">Demander</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="config-section">
              <h4>⚠️ Seuils d'erreur</h4>
              <div class="config-row">
                <div class="config-field">
                  <label>Erreurs max : {{ importConfig.maxErrors }}</label>
                  <input 
                    type="range" 
                    v-model.number="importConfig.maxErrors" 
                    min="0" 
                    max="50" 
                    step="1"
                  />
                </div>
                <div class="config-field">
                  <label>Taux d'erreur max : {{ (importConfig.errorThreshold * 100) }}%</label>
                  <input 
                    type="range" 
                    v-model.number="importConfig.errorThreshold" 
                    min="0" 
                    max="0.5" 
                    step="0.05"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="grid-upload">
            <div class="upload-field" :class="{ 'has-file': filesData.produits }">
              <label>📦 1. Produits & Catégories (CSV) *</label>
              <input type="file" @change="e => handleFileSelection(e, 'produits')" accept=".csv" />
              <span v-if="filesData.produits" class="file-info">✓ {{ filesData.produits.length }} ligne(s)</span>
            </div>
            <div class="upload-field" :class="{ 'has-file': filesData.details }">
              <label>⚙️ 2. Détails & Stocks (CSV)</label>
              <input type="file" @change="e => handleFileSelection(e, 'details')" accept=".csv" />
              <span v-if="filesData.details" class="file-info">✓ {{ filesData.details.length }} ligne(s)</span>
            </div>
            <div class="upload-field" :class="{ 'has-file': filesData.clients }">
              <label>👥 3. Clients & Commandes (CSV)</label>
              <input type="file" @change="e => handleFileSelection(e, 'clients')" accept=".csv" />
              <span v-if="filesData.clients" class="file-info">✓ {{ filesData.clients.length }} ligne(s)</span>
            </div>
            <div class="upload-field" :class="{ 'has-file': filesData.images }">
              <label>🖼️ 4. Images (ZIP)</label>
              <input type="file" @change="e => handleFileSelection(e, 'images')" accept=".zip" />
              <span v-if="filesData.images" class="file-info">✓ {{ filesData.images.name }}</span>
            </div>
          </div>

          <button 
            @click="runGlobalImport" 
            class="btn-primary" 
            :disabled="loading || !filesData.produits"
          >
            <span v-if="!loading">🚀 LANCER L'IMPORTATION</span>
            <span v-else><span class="spinner"></span> Import en cours...</span>
          </button>
        </div>

        <!-- Rapport d'import -->
        <div v-if="importReport" class="report-card" :class="{ 'report-error': importReport.stats?.errors > 0 }">
          <h3>📋 Rapport d'import</h3>
          
          <div class="report-stats">
            <div class="stat success">
              <span class="stat-label">✅ Succès:</span>
              <span class="stat-value">{{ importReport.stats?.products || 0 }} produits, {{ importReport.stats?.customers || 0 }} clients, {{ importReport.stats?.orders || 0 }} commandes</span>
            </div>
            <div v-if="importReport.stats?.corrections" class="stat warning">
              <span class="stat-label">🔧 Corrections:</span>
              <span class="stat-value">{{ importReport.stats.corrections }}</span>
            </div>
            <div v-if="importReport.stats?.errors" class="stat error">
              <span class="stat-label">⚠️ Erreurs:</span>
              <span class="stat-value">{{ importReport.stats.errors }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">⏱️ Durée:</span>
              <span class="stat-value">{{ importReport.stats?.duration || 0 }}s</span>
            </div>
          </div>

          <!-- Affichage détaillé des erreurs -->
          <div v-if="importReport.stats?.errors > 0" class="error-details-section">
            <h4>❌ Détails des erreurs</h4>
            <div class="error-list">
              <div v-for="(err, index) in importReport.stats?.errorsList?.slice(0, 20)" :key="index" class="error-item">
                <span class="error-icon">❌</span>
                <span class="error-text">{{ err }}</span>
              </div>
              <div v-if="(importReport.stats?.errorsList?.length || 0) > 20" class="error-more">
                ... et {{ (importReport.stats?.errorsList?.length || 0) - 20 }} autre(s) erreur(s)
              </div>
            </div>
          </div>

          <!-- Affichage détaillé des corrections -->
          <div v-if="importReport.stats?.corrections > 0" class="corrections-section">
            <h4>🔧 Corrections appliquées</h4>
            <div class="corrections-list">
              <div v-for="(correction, index) in importReport.stats?.correctionsList?.slice(0, 20)" :key="index" class="correction-item">
                <span class="correction-icon">✓</span>
                <span class="correction-text">{{ correction }}</span>
              </div>
              <div v-if="(importReport.stats?.correctionsList?.length || 0) > 20" class="more">
                ... et {{ (importReport.stats?.correctionsList?.length || 0) - 20 }} autre(s) correction(s)
              </div>
            </div>
          </div>

          <div class="report-actions">
            <button v-if="importReport" @click="downloadReport" class="btn-report">📄 Télécharger le rapport</button>
          </div>
        </div>
      </div>

      <!-- Vue Reset -->
      <div v-else-if="view === 'reset'" class="view-container">
        <h1>🗑️ Réinitialisation</h1>
        <p class="subtitle">⚠️ Attention : cette action est irréversible</p>
        <div class="card border-red">
          <div class="reset-options">
            <select v-model="selectedResetModule" class="reset-select">
              <option value="products">📦 Produits</option>
              <option value="customers">👥 Clients</option>
              <option value="categories">📁 Catégories</option>
              <option value="all">🔴 TOUT (produits + clients + catégories)</option>
            </select>
            <button @click="handleStartReset" class="btn-danger" :disabled="loading">
              🗑️ Vider le module
            </button>
          </div>
          <p class="warning-text" v-if="selectedResetModule === 'all'">
            ⚠️ Cette action supprimera TOUTES les données des modules sélectionnés !
          </p>
        </div>
      </div>

      <!-- Vue Dashboard -->
      <div v-else-if="view === 'dashboard'" class="view-container" style="max-width: none;">
        <DashboardView />
      </div>

      <!-- Vue Gestion du Stock -->
      <div v-else-if="view === 'stock-management'" class="view-container" style="max-width: none;">
        <StockManagement />
      </div>

      <!-- Vue Évolution du Stock -->
      <div v-else-if="view === 'stock-evolution'" class="view-container" style="max-width: none;">
        <StockEvolution />
      </div>

      <!-- Message de statut toast -->
      <Transition name="toast">
        <div v-if="statusMessage" class="status-toast" :class="{ 'error-toast': isError }">
          <span class="toast-icon">{{ isError ? '⚠️' : '✅' }}</span>
          <span>{{ statusMessage }}</span>
          <button @click="statusMessage = ''" class="toast-close">×</button>
        </div>
      </Transition>
    </main>

    <!-- Modal de confirmation pour les erreurs -->
    <div v-if="pendingError" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>⚠️ Problème détecté</h3>
        <p><strong>Ligne {{ pendingError.line }}:</strong> {{ pendingError.message }}</p>
        <pre class="error-data">{{ JSON.stringify(pendingError.data, null, 2) }}</pre>
        <div class="modal-actions">
          <button @click="resolveError('skip')" class="btn-skip">⏭️ Ignorer cette ligne</button>
          <button @click="resolveError('fix')" class="btn-fix">🔧 Corriger automatiquement</button>
          <button @click="resolveError('retry')" class="btn-retry">🔄 Réessayer</button>
          <button @click="resolveError('stop')" class="btn-stop">⏹️ Arrêter l'import</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { ImportService } from '../services/ImportService.js'
import { ResetService } from '../services/ResetService.js'
import { AuthService } from '../services/AuthService.js'
import DashboardView from './DashboardView.vue'
import StockManagement from './StockManagement.vue'
import StockEvolution from './StockEvolution.vue'
import { defaultImportConfig } from '../config/importConfig.js'

// ========== ÉTAT ==========
const view = ref('import')
const loading = ref(false)
const statusMessage = ref('')
const isError = ref(false)
const selectedResetModule = ref('products')
const importReport = ref(null)
const pendingError = ref(null)
const showConfig = ref(false)
let errorResolver = null

// Configuration de l'import
const importConfig = ref(defaultImportConfig)

// Données des fichiers
const filesData = reactive({
  produits: null,
  details: null,
  clients: null,
  images: null
})

// Nettoyage des timeouts
let timeoutId = null
let statusTimeout = null

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
  if (statusTimeout) clearTimeout(statusTimeout)
})

// ========== GESTION DES FICHIERS ==========
const handleFileSelection = (event, type) => {
  try {
    const file = event.target.files[0]
    if (!file) return

    if (type === 'images') {
      filesData.images = file
      showStatus(`✓ Fichier ZIP sélectionné: ${file.name}`, false)
    } else {
      const reader = new FileReader()
      
      reader.onerror = (error) => {
        showStatus(`❌ Erreur lecture fichier: ${error.message}`, true)
      }
      
      reader.onload = (e) => {
        try {
          const content = e.target.result
          const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '')
          
          if (lines.length < 2) {
            showStatus('❌ Fichier vide ou invalide', true)
            return
          }
          
          const firstLine = lines[0]
          const separator = firstLine.includes(';') ? ';' : ','
          
          const headers = firstLine.split(separator).map(h => h.trim().toLowerCase())
          
          const parsedData = []
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(separator)
            const obj = {}
            headers.forEach((h, idx) => {
              let value = values[idx]?.trim() || ''
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1)
              }
              obj[h] = value
            })
            parsedData.push(obj)
          }
          
          filesData[type] = parsedData
          showStatus(`✓ ${parsedData.length} ligne(s) chargée(s) (${type})`, false)
          
          console.log(`📊 Aperçu ${type}:`, parsedData.slice(0, 2))
          
        } catch (parseError) {
          console.error('Parse error:', parseError)
          showStatus(`❌ Erreur parse CSV: ${parseError.message}`, true)
        }
      }
      
      reader.readAsText(file, 'UTF-8')
    }
  } catch (error) {
    showStatus(`❌ Erreur sélection fichier: ${error.message}`, true)
  }
}

const showStatus = (message, isErrorMsg) => {
  statusMessage.value = message
  isError.value = isErrorMsg
  
  if (statusTimeout) clearTimeout(statusTimeout)
  statusTimeout = setTimeout(() => {
    if (statusMessage.value === message) {
      statusMessage.value = ''
    }
  }, 5000)
}

// ========== IMPORT GLOBAL ==========
const runGlobalImport = async () => {
  if (!filesData.produits || filesData.produits.length === 0) {
    showStatus("❌ Veuillez sélectionner le fichier Produits", true)
    return
  }

  if (loading.value) {
    showStatus("⏳ Import déjà en cours...", false)
    return
  }

  loading.value = true
  importReport.value = null
  showStatus("🔄 Importation en cours...", false)

  try {
    ImportService.setConfig({
      interactiveMode: importConfig.value.interactiveMode,
      strictMode: importConfig.value.strictMode,
      duplicateStrategy: importConfig.value.errorHandling?.duplicate_email || 'suffix',
      onError: importConfig.value.interactiveMode ? handleImportError : null
    })

    const importPromise = ImportService.processGlobalImport(filesData)
    const timeoutPromise = new Promise((_, reject) =>
      timeoutId = setTimeout(() => reject(new Error('Timeout import (>60s)')), 120000)
    )

    const result = await Promise.race([importPromise, timeoutPromise])
    
    // Enrichir le rapport avec les listes détaillées d'erreurs et corrections
    importReport.value = {
      ...result,
      stats: {
        ...result.stats,
        errorsList: ImportService.importState?.errors || [],
        correctionsList: ImportService.importState?.corrections || [],
      }
    }
    showStatus(result.message, !result.success)

  } catch (err) {
    console.error("❌ Erreur import:", err)
    showStatus(`❌ ${err.message || 'Erreur inconnue'}`, true)
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    loading.value = false
  }
}

const handleImportError = (error, resolve) => {
  pendingError.value = error
  errorResolver = resolve
}

const resolveError = (action) => {
  if (errorResolver) {
    errorResolver(action)
    pendingError.value = null
    errorResolver = null
  }
}

const closeModal = () => {
  if (pendingError.value) {
    resolveError('skip')
  }
}

const downloadReport = () => {
  if (!importReport.value) return
  
  const reportData = {
    timestamp: new Date().toISOString(),
    ...importReport.value
  }
  
  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `import_report_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  showStatus("📄 Rapport téléchargé", false)
}

// ========== RÉINITIALISATION ==========
const handleStartReset = async () => {
  const moduleName = selectedResetModule.value === 'all' ? 'tout' : selectedResetModule.value
  if (!confirm(`⚠️ Êtes-vous sûr de vouloir vider ${moduleName}? Cette action est irréversible.`)) {
    return
  }

  if (loading.value) {
    showStatus("⏳ Une opération est déjà en cours...", false)
    return
  }

  loading.value = true
  showStatus(`🗑️ Réinitialisation ${moduleName} en cours...`, false)

  try {
    let result
    if (selectedResetModule.value === 'all') {
      await Promise.all([
        ResetService.resetModule('products'),
        ResetService.resetModule('customers'),
        ResetService.resetModule('categories')
      ])
      result = { success: true, message: `✅ Tous les modules ont été réinitialisés` }
    } else {
      result = await ResetService.resetModule(selectedResetModule.value)
    }
    
    showStatus(result.message || `✅ ${selectedResetModule.value} vidés`, !result.success)

  } catch (err) {
    console.error("❌ Erreur réinitialisation:", err)
    showStatus(`❌ ${err.message}`, true)
  } finally {
    loading.value = false
  }
}

// ========== NAVIGATION ==========
const handleVisitShop = () => {
  if (loading.value) {
    showStatus("⏳ Veuillez attendre la fin de l'opération", false)
    return
  }
  window.open('/shop', '_blank')
}

const handleLogout = () => {
  if (loading.value) {
    showStatus("⏳ Impossible de se déconnecter pendant une opération", false)
    return
  }
  
  AuthService.logout()
  window.location.href = '/login'
}
</script>

<style scoped>
/* ========== LAYOUT PRINCIPAL ========== */
.backoffice-layout {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

.sidebar {
  width: 280px;
  background: linear-gradient(135deg, #1a2a6c 0%, #2d4a8d 100%);
  color: white;
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  height: 100vh;
}

.logo {
  margin-bottom: 40px;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.logo h2 {
  margin: 0 0 5px 0;
  font-size: 1.8rem;
}

.logo span {
  font-size: 0.75rem;
  opacity: 0.8;
}

nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

nav button {
  padding: 12px 16px;
  border: none;
  background: rgba(255,255,255,0.1);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;
  text-align: left;
}

nav button:hover {
  background: rgba(255,255,255,0.2);
  transform: translateX(5px);
}

nav button.active {
  background: rgba(255,255,255,0.25);
  font-weight: bold;
}

.btn-shop, .btn-logout {
  margin-top: 10px;
  font-weight: bold;
}

.btn-shop {
  background: #27ae60;
}

.btn-shop:hover {
  background: #229954;
}

.btn-logout {
  background: #e74c3c;
}

.btn-logout:hover {
  background: #c0392b;
}

/* ========== CONTENU PRINCIPAL ========== */
.content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.view-container {
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  color: #1a2a6c;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 30px;
}

/* ========== CONFIGURATION ========== */
.config-card {
  background: white;
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.3s;
}

.config-header:hover {
  background: #e9ecef;
}

.config-header h3 {
  margin: 0;
  color: #1a2a6c;
  font-size: 1rem;
}

.toggle-icon {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.config-body {
  padding: 20px;
  border-top: 1px solid #ecf0f1;
}

.config-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.config-section h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 0.9rem;
}

.config-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.config-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #7f8c8d;
}

.config-field select,
.config-field input[type="range"] {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 0.85rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #2c3e50;
}

/* ========== CARTES ========== */
.card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* ========== GRILLE UPLOAD ========== */
.grid-upload {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.upload-field {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
  transition: all 0.3s;
  position: relative;
}

.upload-field:hover {
  background: #f0f1f3;
  border-color: #667eea;
}

.upload-field.has-file {
  border-color: #27ae60;
  background: #f0fff4;
}

.upload-field label {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
  display: block;
  color: #333;
}

.upload-field input[type="file"] {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
}

.file-info {
  display: block;
  margin-top: 10px;
  font-size: 0.8rem;
  color: #27ae60;
  font-weight: 500;
}

/* ========== BOUTONS ========== */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 0.95rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
}

.btn-report {
  margin-top: 15px;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

/* ========== RAPPORT ========== */
.report-card {
  background: #e8f5e9;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.report-card.report-error {
  background: #ffebee;
}

.report-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.stat {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.stat-label {
  font-weight: 600;
  color: #555;
}

.stat-value {
  font-weight: bold;
  color: #1a2a6c;
}

.stat.success .stat-label {
  color: #27ae60;
}

.stat.warning .stat-label {
  color: #f39c12;
}

.stat.error .stat-label {
  color: #e74c3c;
}

/* === DÉTAILS DES ERREURS === */
.error-details-section,
.corrections-section {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
}

.error-details-section {
  background-color: #ffebee;
  border-left: 4px solid #e74c3c;
}

.corrections-section {
  background-color: #e8f5e9;
  border-left: 4px solid #27ae60;
}

.error-details-section h4,
.corrections-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
}

.error-list,
.corrections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
}

.error-item,
.correction-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.error-icon {
  font-size: 16px;
  min-width: 20px;
}

.correction-icon {
  font-size: 16px;
  min-width: 20px;
  color: #27ae60;
}

.error-text,
.correction-text {
  flex: 1;
  color: #2c3e50;
  word-break: break-word;
}

.error-more,
.more {
  padding: 8px;
  color: #7f8c8d;
  font-size: 12px;
  font-style: italic;
  text-align: center;
}

.report-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

/* ========== RESET ========== */
.reset-options {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.reset-select {
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #ddd;
  min-width: 200px;
}

.warning-text {
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border-radius: 8px;
  color: #856404;
  font-size: 0.85rem;
}

.card.border-red {
  border: 2px solid #e74c3c;
}

/* ========== TOAST NOTIFICATION ========== */
.status-toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #27ae60;
  color: white;
  padding: 12px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}

.status-toast.error-toast {
  background: #e74c3c;
}

.toast-icon {
  font-size: 1.2rem;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 5px;
}

/* ========== MODAL ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 25px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  color: #e74c3c;
  margin-top: 0;
}

.error-data {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 15px 0;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.modal-actions button {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-skip {
  background: #95a5a6;
  color: white;
}

.btn-fix {
  background: #3498db;
  color: white;
}

.btn-retry {
  background: #f39c12;
  color: white;
}

.btn-stop {
  background: #e74c3c;
  color: white;
}

/* ========== SPINNER ========== */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========== TRANSITIONS ========== */
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .backoffice-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .content {
    padding: 20px;
  }
  
  .grid-upload {
    grid-template-columns: 1fr;
  }
  
  .config-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .config-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .status-toast {
    bottom: 20px;
    right: 20px;
    left: 20px;
  }
}
</style>