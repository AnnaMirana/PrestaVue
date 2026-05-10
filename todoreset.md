♻️ To-Do List : La Réinitialisation par Module
1. L'Interface (Front-end)
[x] Réutiliser la structure : Dans App.vue, quand view === 'reset', on garde le même menu déroulant (Select) pour choisir le module.

[x] Le Bouton d'Action : On remplace le bouton "Importer" par un bouton "Vider le module" (souvent mis en rouge pour prévenir du danger).

[x] Alerte de sécurité : Ajouter une confirmation (confirm()) avant de lancer la suppression pour éviter les erreurs.

2. La Mécanique de Suppression (Le tunnel inversé)
[x] Récupérer les IDs (GET) : Pour vider un module, il faut d'abord demander à PrestaShop la liste de tous les IDs existants (ex: tous les IDs des produits).

[x] La Boucle de Nettoyage : Créer une fonction dans ImportService.js (ou un nouveau ResetService.js) qui boucle sur ces IDs et appelle la méthode DELETE de l'API pour chacun.

Compréhension : On ne peut pas dire "supprime tout" en une seule commande à l'API, on doit lui dire "supprime l'ID 1, puis l'ID 2, etc.".

3. La Séparation des Modules (Dans le code)
[x] Fonctions dédiées :

resetProducts() : Supprime les produits.

resetCustomers() : Supprime les clients.

resetCategories() : Supprime les catégories (attention à ne pas supprimer la catégorie "Accueil" ID 2 !).