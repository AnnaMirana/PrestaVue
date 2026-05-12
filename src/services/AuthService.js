/**
 * AuthService.js
 * Gestion centralisée de l'authentification
 * - Vérifie les credentials
 * - Stocke le token dans localStorage
 * - Fournit des méthodes pour vérifier l'authentification
 */

const STORAGE_KEY = 'prestavue_auth_token';
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';

export const AuthService = {
  /**
   * Authentifie l'utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {object} { success: boolean, message: string }
   */
  login(username, password) {
    // Validation basique
    if (!username || !password) {
      return {
        success: false,
        message: 'Veuillez remplir tous les champs'
      };
    }

    // Vérification des credentials
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const token = btoa(`${username}:${password}:${Date.now()}`);
      localStorage.setItem(STORAGE_KEY, token);
      return {
        success: true,
        message: 'Connexion réussie'
      };
    }

    return {
      success: false,
      message: 'Identifiants incorrects'
    };
  },

  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEY);
  },

  /**
   * Récupère le token stocké
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEY);
  }
};
