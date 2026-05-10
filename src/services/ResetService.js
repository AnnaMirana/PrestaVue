import { ApiService } from './ApiService';

export const ResetService = {

    // 📦 RÉINITIALISER LES PRODUITS
    async resetProducts() {
        console.log("Nettoyage des produits...");
        const ids = await this.getAllIds('products');
        for (const id of ids) {
            await ApiService.delete('products', id);
        }
        return ids.length;
    },

    // 👤 RÉINITIALISER LES CLIENTS
    async resetCustomers() {
        console.log("Nettoyage des clients...");
        const ids = await this.getAllIds('customers');
        for (const id of ids) {
            await ApiService.delete('customers', id);
        }
        return ids.length;
    },

    // 📁 RÉINITIALISER LES CATÉGORIES (AVEC SÉCURITÉ)
    async resetCategories() {
        console.log("Nettoyage des catégories...");
        const ids = await this.getAllIds('categories');
        let deletedCount = 0;
        for (const id of ids) {
            // SÉCURITÉ : On ne touche pas aux IDs 1 et 2
            if (id > 2) {
                if (await ApiService.delete('categories', id)) deletedCount++;
            }
        }
        return deletedCount;
    },

    // 🛒 RÉINITIALISER LES PANIERS (CARTS)
    async resetCarts() {
        const ids = await this.getAllIds('carts');
        for (const id of ids) {
            await ApiService.delete('carts', id);
        }
        return ids.length;
    },

    // 🛠️ OUTIL : RÉCUPÉRER TOUS LES IDS D'UN MODULE
    async getAllIds(resource) {
        try {
            // On demande juste les IDs pour aller vite
            const xmlText = await ApiService.get(`${resource}?display=[id]`);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const elements = xmlDoc.getElementsByTagName('id');
            
            let ids = [];
            for (let i = 0; i < elements.length; i++) {
                ids.push(elements[i].textContent);
            }
            return ids;
        } catch (error) {
            console.error(`Erreur lors de la récupération des IDs pour ${resource}`);
            return [];
        }
    }
};