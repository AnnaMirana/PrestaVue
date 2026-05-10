<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>PrestaVue</h2>
        <span>ITU Madagascar - P17</span>
      </div>
      <nav>
        <button :class="{ active: view === 'import' }" @click="view = 'import'">Import CSV</button>
        <button :class="{ active: view === 'reset' }" @click="view = 'reset'">Réinitialisation</button>
        <button :class="{ active: view === 'dashboard' }" @click="view = 'dashboard'">Dashboard</button>
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
import { ref } from 'vue';
import { ImportService } from './services/ImportService';
import { ResetService } from './services/ResetService';
import './App.css';

// Navigation et états
const view = ref('import');

const loading = ref(false);
const statusMessage = ref('');
const isError = ref(false);

// États Import
const selectedModule = ref('products');
const fileName = ref('');
const csvData = ref([]);

// États Reset
const selectedResetModule = ref('products');


const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  fileName.value = file.name;
  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    csvData.value = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i]?.trim());
      return obj;
    });
    statusMessage.value = `Fichier prêt : ${csvData.value.length} lignes détectées.`;
    isError.value = false;
  };
  reader.readAsText(file);
};


const handleStartImport = async () => {
  loading.value = true;
  statusMessage.value = "Importation en cours vers PrestaShop...";
  try {
    let count = 0;
    if (selectedModule.value === 'products') count = await ImportService.importProducts(csvData.value);
    if (selectedModule.value === 'customers') count = await ImportService.importCustomers(csvData.value);
    
    statusMessage.value = `Succès : ${count} éléments importés dans ${selectedModule.value}.`;
    csvData.value = [];
    fileName.value = '';
  } catch (e) {
    statusMessage.value = "Erreur durant l'importation.";
    isError.value = true;
  } finally {
    loading.value = false;
  }
};


const handleStartReset = async () => {
  const confirmAction = confirm(`Voulez-vous vraiment vider TOUT le module ${selectedResetModule.value} ?`);
  if (!confirmAction) return;

  loading.value = true;
  statusMessage.value = "Nettoyage de la base de données...";
  try {
    let count = 0;
    if (selectedResetModule.value === 'products') count = await ResetService.resetProducts();
    if (selectedResetModule.value === 'customers') count = await ResetService.resetCustomers();
    if (selectedResetModule.value === 'categories') count = await ResetService.resetCategories();

    statusMessage.value = `Terminé : ${count} éléments supprimés de ${selectedResetModule.value}.`;
  } catch (e) {
    statusMessage.value = "Erreur durant la réinitialisation.";
    isError.value = true;
  } finally {
    loading.value = false;
  }
};
</script>


