<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>PrestaVue</h1>
        <p>Backoffice Administration</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field-group">
          <label for="username">Identifiant</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Entrez votre identifiant"
            class="input-field"
            :disabled="isLoading"
          />
        </div>

        <div class="field-group">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Entrez votre mot de passe"
            class="input-field"
            :disabled="isLoading"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">Se connecter</span>
          <span v-else>Connexion en cours...</span>
        </button>
      </form>

      <div class="login-hint">
        <p><strong>Démo :</strong> admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../services/AuthService.js'

defineProps({
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['login'])

const router = useRouter()
const username = ref('admin')
const password = ref('admin123')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const result = AuthService.login(username.value, password.value)

    if (result.success) {
      await router.push('/backoffice')
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = 'Erreur lors de la connexion'
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2a6c 0%, #2d4a8d 100%);
  font-family: 'Segoe UI', sans-serif;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  color: #1a2a6c;
  font-size: 2.5rem;
  margin: 0 0 10px 0;
}

.login-header p {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-group label {
  font-weight: 600;
  color: #34495e;
  font-size: 0.95rem;
}

.input-field {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #1a2a6c;
  box-shadow: 0 0 0 3px rgba(26, 42, 108, 0.1);
}

.input-field:disabled {
  background-color: #ecf0f1;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 15px;
  background-color: #fadbd8;
  border-left: 4px solid #e74c3c;
  border-radius: 4px;
  color: #c0392b;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-login {
  padding: 12px 20px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-top: 10px;
}

.btn-login:hover:not(:disabled) {
  background-color: #229954;
  transform: translateY(-2px);
}

.btn-login:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  transform: none;
}

.login-hint {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.login-hint p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.85rem;
}

.login-hint strong {
  color: #34495e;
}
</style>
