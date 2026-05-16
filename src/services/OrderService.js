import { ApiService } from './ApiService.js';

/**
 * OrderService.js
 * Gestion des commandes (Orders) dans PrestaShop
 * - Récupère les commandes
 * - Modifie l'état des commandes
 * - Gère les paiements "à la livraison"
 */

export const OrderService = {
  /**
   * Récupère toutes les commandes
   * @returns {Promise<array>} Liste des commandes avec détails
   */
  async getOrders() {
    try {
      const xml = await ApiService.get('orders');
      if (!xml) return [];

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const orders = [];

      const orderElements = xmlDoc.getElementsByTagName('order');
      for (let i = 0; i < orderElements.length; i++) {
        const orderEl = orderElements[i];
        const id = orderEl.getElementsByTagName('id')[0]?.textContent || '';
        const reference = orderEl.getElementsByTagName('reference')[0]?.textContent || '';
        const idCustomer = orderEl.getElementsByTagName('id_customer')[0]?.textContent || '';
        const totalPaid = orderEl.getElementsByTagName('total_paid')[0]?.textContent || '0';
        const currentState = orderEl.getElementsByTagName('current_state')[0]?.textContent || '';
        const paymentMethod = orderEl.getElementsByTagName('payment')[0]?.textContent || 'Non spécifié';
        const dateAdd = orderEl.getElementsByTagName('date_add')[0]?.textContent || '';

        orders.push({
          id,
          reference,
          idCustomer,
          totalPaid: parseFloat(totalPaid),
          currentState: parseInt(currentState),
          paymentMethod,
          dateAdd,
        });
      }

      return orders;
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      return [];
    }
  },

  /**
   * Récupère une commande spécifique par ID
   * @param {number} orderId - ID de la commande
   * @returns {Promise<object|null>} Détails de la commande ou null
   */
  async getOrder(orderId) {
    try {
      const xml = await ApiService.get(`orders/${orderId}`);
      if (!xml) return null;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const orderEl = xmlDoc.getElementsByTagName('order')[0];

      if (!orderEl) return null;

      const id = orderEl.getElementsByTagName('id')[0]?.textContent || '';
      const reference = orderEl.getElementsByTagName('reference')[0]?.textContent || '';
      const idCustomer = orderEl.getElementsByTagName('id_customer')[0]?.textContent || '';
      const totalPaid = orderEl.getElementsByTagName('total_paid')[0]?.textContent || '0';
      const currentState = orderEl.getElementsByTagName('current_state')[0]?.textContent || '';
      const paymentMethod = orderEl.getElementsByTagName('payment')[0]?.textContent || 'Paiement à la livraison';
      const dateAdd = orderEl.getElementsByTagName('date_add')[0]?.textContent || '';

      return {
        id,
        reference,
        idCustomer,
        totalPaid: parseFloat(totalPaid),
        currentState: parseInt(currentState),
        paymentMethod,
        dateAdd,
      };
    } catch (error) {
      console.error('Erreur récupération commande:', error);
      return null;
    }
  },

  /**
   * Met à jour l'état d'une commande
   * États possibles:
   * - 1: Annulée
   * - 2: Paiement accepté
   * - 3: Préparation en cours
   * - 4: Livraison en cours
   * - 5: Livrée
   * - 6: Remboursée
   * - 7: Erreur paiement
   * - 8: Attente paiement
   * - 9: En attente de paiement à la livraison
   *
   * @param {number} orderId - ID de la commande
   * @param {number} newState - Nouvel état (1-9)
   * @returns {Promise<object>} { success, message, orderId, newState }
   */
  async updateOrderState(orderId, newState) {
    try {
      if (!orderId || !newState) {
        return {
          success: false,
          message: 'Paramètres invalides: orderId et newState requis',
        };
      }

      // Vérifier que newState est valide
      if (![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(newState)) {
        return {
          success: false,
          message: `État invalide: ${newState}. États acceptés: 1-9`,
        };
      }

      // Créer le XML de mise à jour
      const xml = `
        <prestashop>
          <order>
            <current_state>${newState}</current_state>
          </order>
        </prestashop>`;

      const response = await ApiService.put('orders', orderId, xml);

      if (response.ok) {
        return {
          success: true,
          message: `État de la commande ${orderId} mis à jour vers ${newState}`,
          orderId,
          newState,
        };
      } else {
        return {
          success: false,
          message: `Erreur mise à jour: ${response.status}`,
          error: response.text,
        };
      }
    } catch (error) {
      console.error('Erreur update état commande:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  },

  /**
   * Crée une commande simple pour le FrontOffice
   * Paiement à la livraison uniquement
   *
   * @param {object} data - { cartId, customerId, addressDeliveryId, addressInvoiceId }
   * @returns {Promise<object>} { success, orderId, message }
   */
  async createOrderFromCart({ cartId, customerId, addressDeliveryId, addressInvoiceId }) {
    try {
      if (!cartId || !customerId) {
        return {
          success: false,
          message: 'cartId et customerId sont requis',
        };
      }

      const xml = `
        <prestashop>
          <order>
            <id_customer>${customerId}</id_customer>
            <id_cart>${cartId}</id_cart>
            <id_currency>1</id_currency>
            <id_address_delivery>${addressDeliveryId || customerId}</id_address_delivery>
            <id_address_invoice>${addressInvoiceId || customerId}</id_address_invoice>
            <payment>Paiement à la livraison</payment>
            <current_state>9</current_state>
          </order>
        </prestashop>`;

      const response = await ApiService.post('orders', xml);

      if (response.ok) {
        // Parser la réponse pour récupérer l'ID de la commande
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.text, 'text/xml');
        const orderIdStr = xmlDoc.getElementsByTagName('id')[0]?.textContent || '';
        const orderId = orderIdStr ? Number(orderIdStr) : null;

        return {
          success: true,
          orderId,
          message: `Commande créée avec succès (ID: ${orderId})`,
        };
      } else {
        return {
          success: false,
          message: `Erreur création commande: ${response.status}`,
          error: response.text,
        };
      }
    } catch (error) {
      console.error('Erreur création commande:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  },

  /**
   * Map les états de commande vers des labels lisibles
   * @param {number} stateId - ID de l'état
   * @returns {string} Label de l'état
   */
  getStateLabel(stateId) {
    const stateMap = {
      1: 'Annulée',
      2: 'Paiement accepté',
      3: 'Préparation',
      4: 'Livraison',
      5: 'Livrée',
      6: 'Remboursée',
      7: 'Erreur paiement',
      8: 'Attente paiement',
      9: 'Attente paiement à la livraison',
    };
    return stateMap[stateId] || `État ${stateId}`;
  },

  /**
   * Map les états modifiables pour l'UI
   * @returns {array} États disponibles pour modification
   */
  getAvailableStates() {
    return [
      { id: 1, label: 'Annulée' },
      { id: 2, label: 'Paiement accepté' },
      { id: 3, label: 'Préparation en cours' },
      { id: 4, label: 'Livraison en cours' },
      { id: 5, label: 'Livrée' },
      { id: 6, label: 'Remboursée' },
      { id: 7, label: 'Erreur de paiement' },
      { id: 8, label: 'Attente paiement' },
      { id: 9, label: 'Attente paiement à la livraison' },
    ];
  },
};
