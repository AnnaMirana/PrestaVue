import { ApiService } from './ApiService';

export const ResetService = {

    // 🔁 Réinitialiser un module depuis l'UI
    // BackofficeView passe selectedResetModule.value (products|customers|categories)
    async resetModule(moduleName) {
        const name = String(moduleName || '').toLowerCase();

        if (name === 'products') {
            const count = await this.resetProducts();
            return { success: true, message: `Produits vidés : ${count}` };
        }

        if (name === 'customers') {
            const count = await this.resetCustomers();
            return { success: true, message: `Clients vidés : ${count}` };
        }

        if (name === 'categories') {
            const count = await this.resetCategories();
            return { success: true, message: `Catégories vidées : ${count}` };
        }

        // Si jamais l'UI envoie autre chose
        return { success: false, message: `Module inconnu pour reset : ${moduleName}` };
    },

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

