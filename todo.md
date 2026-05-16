# TODO - Jour 3 (NewAPP)

## Import (Backoffice)
- [ ] Valider les erreurs d’import :
  - [ ] Nom de colonne non conforme (détection + remontée ligne/champ)
  - [ ] Date au format différent de `DD/MM/YYYY` (contrôle strict)
  - [ ] Montant positif (contrôle >= 0 ou > 0 selon besoin)
- [ ] Mettre à jour `src/services/ImportService.js` pour produire une structure d’erreurs exploitable par l’UI.
- [ ] Mettre à jour `src/views/BackofficeView.vue` pour afficher ces erreurs clairement.

## Backoffice - Stock
- [ ] Ajouter une page “Ajout en stock” (Vue) : `src/views/BackofficeStockAdd.vue`
- [ ] Ajouter une page “Historique évolution stock journalier” (Vue) : `src/views/BackofficeStockHistory.vue`
- [ ] Ajouter un service stock (Vue/JS) : `src/services/StockService.js` (requêtes XML PrestaShop)
- [ ] Intégrer les deux pages dans la sidebar de `src/views/BackofficeView.vue`

## Frontoffice
- [ ] Récupérer le stock disponible pour chaque produit dans `src/views/FrontofficeView.vue`
- [ ] Afficher la quantité en stock disponible sur l’écran produits

## Validation / Tests
- [ ] Lancer `npm run dev`
- [ ] Tester : import -> erreurs détectées (colonnes/date/montant)
- [ ] Tester : ajout en stock -> mise à jour effective
- [ ] Tester : historique -> tableau rempli
- [ ] Tester : front -> stock affiché

