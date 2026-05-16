/**
 * AuthService.js
 * Gestion centralisée de l'authentification
 * - Vérifie les credentials
 * - Stocke le token + customer_id dans localStorage
 * - Fournit des méthodes pour vérifier l'authentification et accéder aux données client
 */

const STORAGE_KEY = 'prestavue_auth_token';
const CUSTOMER_ID_KEY = 'prestavue_customer_id';
const CUSTOMER_EMAIL_KEY = 'prestavue_customer_email';
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
      // Pour l'admin, pas de customer_id
      localStorage.removeItem(CUSTOMER_ID_KEY);
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
   * Login client (pour FrontOffice)
   * @param {number} customerId - ID du client PrestaShop
   * @param {string} email - Email du client
   */
  loginCustomer(customerId, email) {
    const token = btoa(`customer:${customerId}:${Date.now()}`);
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(CUSTOMER_ID_KEY, customerId.toString());
    localStorage.setItem(CUSTOMER_EMAIL_KEY, email);
  },

  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOMER_ID_KEY);
    localStorage.removeItem(CUSTOMER_EMAIL_KEY);
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
  },

  /**
   * Récupère l'ID du client (si connecté via FrontOffice)
   * @returns {number|null}
   */
  getCustomerId() {
    const id = localStorage.getItem(CUSTOMER_ID_KEY);
    return id ? parseInt(id, 10) : null;
  },

  /**
   * Récupère l'email du client
   * @returns {string|null}
   */
  getCustomerEmail() {
    return localStorage.getItem(CUSTOMER_EMAIL_KEY);
  },

  /**
   * Vérifie si c'est un client (pas l'admin)
   * @returns {boolean}
   */
  isCustomerLoggedIn() {
    return !!localStorage.getItem(CUSTOMER_ID_KEY);
  }
};
