const API_KEY = "5SYPY9N926AJC1FR75YVNBFXVAPJFFBC";
const BASE_URL = "http://localhost/prestashop/api";

export const ApiService = {
  // MÉTHODE GET : Pour récupérer la liste des IDs (utile pour le Reset)
  async get(resource) {
    try {
      const response = await fetch(`${BASE_URL}/${resource}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(API_KEY + ':')
        }
      });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return await response.text(); // On récupère le XML brut
    } catch (error) {
      console.error("Erreur API GET:", error);
      return null;
    }
  },

  // MÉTHODE POST : Pour l'Import
  async post(resource, xmlData) {
    try {
      const response = await fetch(`${BASE_URL}/${resource}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(API_KEY + ':'),
          'Content-Type': 'application/xml'
        },
        body: xmlData.trim()
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // MÉTHODE DELETE : Pour le Reset
  async delete(resource, id) {
    try {
      const response = await fetch(`${BASE_URL}/${resource}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(API_KEY + ':')
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};