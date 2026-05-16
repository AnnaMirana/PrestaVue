const API_KEY = "1AKJV9RVNJ9UWST4SE4J5BC14WU93LN6";
const BASE_URL = "http://localhost/orig/api";

export const ApiService = {
  // MÉTHODE GET : Pour récupérer la liste des IDs (utile pour le Reset)
  async get(resource, options = {}) {
    try {
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(API_KEY + ':')
        },
        ...options // Supporte les signaux d'annulation, etc.
      };

      const response = await fetch(`${BASE_URL}/${resource}`, fetchOptions);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error("Erreur API GET:", error);
      throw error;
    }
  },

  async post(resource, xmlData, options = {}) {
    const url = `${BASE_URL}/${resource}`;

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(API_KEY + ':'),
        'Content-Type': 'application/xml; charset=utf-8'
      },
      body: xmlData,
      ...options // Supporte signal et autres options
    };

    const response = await fetch(url, fetchOptions);
    const text = await response.text();

    // Normalisation du retour pour que ImportService puisse faire un test fiable
    if (!response.ok) {
      console.error(`Erreur API ${resource} (${response.status}):`, text);
      throw new Error(`API Error ${response.status}: ${text.substring(0, 100)}`);
    }

    return { ok: true, status: response.status, text };
  },

  // MÉTHODE PUT : Pour mettre à jour les ressources
  async put(resource, id, xmlData, options = {}) {
    const url = `${BASE_URL}/${resource}/${id}`;
    
    // ⚠️ CRUCIAL: xmlData doit être une string, pas un objet
    const bodyString = typeof xmlData === 'string' ? xmlData : JSON.stringify(xmlData);
    
    // Extrait signal des options pour éviter qu'il écrase le body
    const { signal, ...restOptions } = options;
    
    const fetchOptions = {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + btoa(API_KEY + ':'),
        'Content-Type': 'application/xml; charset=utf-8'
      },
      body: bodyString,
      // Ajoute signal seulement s'il existe et est valide
      ...(signal ? { signal } : {}),
      ...restOptions
    };

    console.log(`📤 PUT ${url}`, bodyString.substring(0, 200)); // Debug

    const response = await fetch(url, fetchOptions);
    const text = await response.text();

    if (!response.ok) {
      console.error(`Erreur API PUT ${resource}/${id} (${response.status}):`, text);
      throw new Error(`API Error ${response.status}`);
    }

    return { ok: true, status: response.status, text };
  },

  // MÉTHODE DELETE : Pour le Reset
  async delete(resource, id, options = {}) {
    const fetchOptions = {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + btoa(API_KEY + ':')
      },
      ...options // Supporte signal et autres options
    };

    try {
      const response = await fetch(`${BASE_URL}/${resource}/${id}`, fetchOptions);
      return response.ok;
    } catch (error) {
      console.error(`Erreur API DELETE: ${error.message}`);
      throw error;
    }
  }
};