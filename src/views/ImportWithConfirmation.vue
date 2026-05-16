<template>
  <div v-if="pendingErrors.length" class="error-resolution-modal">
    <h3>⚠️ Problèmes détectés lors de l'import</h3>
    
    <div v-for="(error, idx) in pendingErrors" :key="idx" class="error-item">
      <p><strong>Ligne {{ error.rowIndex }}:</strong> {{ error.message }}</p>
      <div class="error-actions">
        <button @click="resolveError(error, 'skip')">⏭️ Ignorer cette ligne</button>
        <button @click="resolveError(error, 'fix')">🔧 Corriger automatiquement</button>
        <button @click="resolveError(error, 'manual')">✏️ Modifier manuellement</button>
        <button @click="resolveError(error, 'retry')">🔄 Réessayer</button>
      </div>
      
      <!-- Édition manuelle -->
      <div v-if="error.mode === 'manual'" class="manual-edit">
        <textarea v-model="error.correctedData" :placeholder="error.originalData"></textarea>
        <button @click="applyManualFix(error)">Appliquer</button>
      </div>
    </div>
    
    <div class="global-actions">
      <button @click="applyToAll('skip')">Ignorer toutes les erreurs</button>
      <button @click="applyToAll('fix')">Corriger automatiquement toutes</button>
      <button @click="continueImport">✅ Continuer l'import</button>
    </div>
  </div>
</template>

<script setup>
const pendingErrors = ref([])
const errorResolutions = ref({}) // Stocke les décisions utilisateur

const resolveError = (error, action) => {
  switch(action) {
    case 'skip':
      errorResolutions.value[error.id] = { action: 'skip' }
      pendingErrors.value = pendingErrors.value.filter(e => e.id !== error.id)
      break
      
    case 'fix':
      const fixed = autoFixError(error)
      errorResolutions.value[error.id] = { action: 'fix', fixedData: fixed }
      pendingErrors.value = pendingErrors.value.filter(e => e.id !== error.id)
      break
      
    case 'manual':
      error.mode = 'manual'
      break
      
    case 'retry':
      // Réessayer l'opération
      retryOperation(error)
      break
  }
}

const autoFixError = (error) => {
  // Correction automatique selon le type d'erreur
  switch(error.type) {
    case 'duplicate_email':
      return { ...error.data, email: `${error.data.email}+duplicate${Date.now()}` }
    case 'invalid_state':
      return { ...error.data, etat: 'dans le panier' }
    case 'invalid_price':
      return { ...error.data, prix_ttc: '0.00' }
    default:
      return error.data
  }
}
</script>