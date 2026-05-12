<template>
  <div class="backoffice-layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>PrestaVue</h2>
        <span>ITU Madagascar - P17</span>
      </div>
      <nav>
        <button :class="{ active: view === 'import' }" @click="view = 'import'">Import CSV</button>
        <button :class="{ active: view === 'reset' }" @click="view = 'reset'">Réinitialisation</button>
        <button :class="{ active: view === 'dashboard' }" @click="view = 'dashboard'">Dashboard</button>
        <button @click="handleLogout" class="btn-logout">Déconnexion</button>
      </nav>
    </aside>

    <main class="content">
      <div v-if="view === 'import'" class="view-container">
        <h1>Import de données</h1>
        <p>Sélectionnez un module et chargez votre fichier CSV.</p>

        <div class="card">
          <div class="field-group">
            <label>Module cible :</label>
            <select v-model="selectedModule">
              <option value="products">Produits</option>
              <option value="customers">Clients</option>
              <option value="categories">Catégories</option>
            </select>
          </div>

          <div class="upload-zone" @click="$refs.fileInput.click()">
            <label class="file-label">
              {{ fileName || "Cliquer ici pour charger un fichier .csv" }}
            </label>
            <input 
              ref="fileInput"
              type="file" 
              @change="handleFileChange" 
              accept=".csv" 
              style="display: none;" 
            />
          </div>

          <button 
            @click="handleStartImport" 
            class="btn-primary" 
            :disabled="!csvData.length || loading"
          >
            <span v-if="!loading">Lancer l'importation</span>
            <span v-else>Traitement en cours...</span>
          </button>
        </div>
      </div>

      <div v-else-if="view === 'reset'" class="view-container">
        <h1>Réinitialisation</h1>
        <p>Supprimez les données existantes pour repartir de zéro.</p>

        <div class="card border-red">
          <div class="field-group">
            <label>Module à vider :</label>
            <select v-model="selectedResetModule">
              <option value="products">Produits</option>
              <option value="customers">Clients</option>
              <option value="categories">Catégories</option>
            </select>
          </div>

          <p class="warning-text">Cette action est irréversible.</p>

          <button 
            @click="handleStartReset" 
            class="btn-danger" 
            :disabled="loading"
          >
            <span v-if="!loading">Vider le module</span>
            <span v-else>Suppression en cours...</span>
          </button>
        </div>
      </div>

      <div v-else class="view-container">
        <h1>Dashboard</h1>
        <div class="card">
          <p>Statistiques de la boutique en temps réel (Bientôt disponible).</p>
        </div>
      </div>

      <div v-if="statusMessage" class="status-box" :class="{ 'error-msg': isError }">
        {{ statusMessage }}
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ImportService } from '../services/ImportService.js'
import { ResetService } from '../services/ResetService.js'
import { AuthService } from '../services/AuthService.js'

const view = ref('import')
const selectedModule = ref('products')
const selectedResetModule = ref('products')
const fileName = ref('')
const csvData = ref([])
const loading = ref(false)
const statusMessage = ref('')
const isError = ref(false)

const router = useRouter()

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  fileName.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    const csv = e.target.result
    // 1. On sépare les lignes et on nettoie les espaces
    const lines = csv.split('\n').map(line => line.trim()).filter(line => line !== '')
    
    if (lines.length < 2) return // Fichier vide ou juste entête

    // 2. On récupère les entêtes (ex: date, nom, email, etc.)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // 3. On transforme chaque ligne en objet structuré
    csvData.value = lines.slice(1).map(line => {
      const values = line.split(',')
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] ? values[index].trim() : ''
      })
      return obj
    })
    
    console.log("Données prêtes :", csvData.value)
  }
  reader.readAsText(file)
}

const handleStartImport = async () => {
  loading.value = true
  statusMessage.value = ''

  try {
    const result = await ImportService.importData(selectedModule.value, csvData.value)
    statusMessage.value = result.message
    isError.value = !result.success

    if (result.success) {
      csvData.value = []
      fileName.value = ''
    }
  } catch (error) {
    statusMessage.value = 'Erreur lors de l\'importation'
    isError.value = true;
    console.log(error);
    
  } finally {
    loading.value = false
  }
}

const handleStartReset = async () => {
  if (!confirm('Êtes-vous sûr de vouloir vider ce module ? Cette action est irréversible.')) {
    return
  }

  loading.value = true
  statusMessage.value = ''

  try {
    const result = await ResetService.resetModule(selectedResetModule.value)
    statusMessage.value = result.message
    isError.value = !result.success
  } catch (error) {
    statusMessage.value = 'Erreur lors de la réinitialisation'
    isError.value = true
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  AuthService.logout()
  router.push('/login')
}
</script>

<style scoped>
.backoffice-layout { display: flex; min-height: 100vh; background-color: #f4f7f6; font-family: 'Segoe UI', sans-serif; }

.sidebar { width: 260px; background-color: #1a2a6c; color: white; padding: 20px; display: flex; flex-direction: column; }
.logo { margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
.sidebar nav { display: flex; flex-direction: column; gap: 10px; }
.sidebar button { background: transparent; border: none; color: #bdc3c7; text-align: left; padding: 12px; cursor: pointer; border-radius: 6px; transition: 0.3s; }
.sidebar button:hover, .sidebar button.active { background: rgba(255,255,255,0.1); color: white; }
.btn-logout { margin-top: auto; background-color: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; color: #e74c3c; font-weight: 600; }
.btn-logout:hover { background-color: rgba(231, 76, 60, 0.3); }

.content { flex: 1; padding: 40px; }
.view-container { max-width: 800px; margin: 0 auto; }
.card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.border-red { border-top: 5px solid #e74c3c; }

.field-group { margin-bottom: 20px; }
label { display: block; margin-bottom: 8px; font-weight: bold; color: #34495e; }
select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }

.upload-zone { border: 2px dashed #3498db; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 20px; cursor: pointer; }
.file-label { color: #3498db; font-weight: 500; cursor: pointer; }

.btn-primary { width: 100%; padding: 15px; background-color: #27ae60; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-danger { width: 100%; padding: 15px; background-color: #e74c3c; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-primary:disabled, .btn-danger:disabled { background-color: #95a5a6; cursor: not-allowed; }

.warning-text { color: #e74c3c; font-size: 0.9rem; margin-bottom: 15px; font-style: italic; }
.status-box { margin-top: 20px; padding: 15px; background-color: #fff; border-left: 5px solid #3498db; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.error-msg { border-left-color: #e74c3c; color: #e74c3c; }
</style>
