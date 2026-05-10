1. Préparer le terrain (L'environnement)
[x] Le berceau du projet : On a lancé Vite pour créer une application Vue.js ultra-rapide. C'est notre base de travail.

[x] Ouvrir la porte de PrestaShop : On est allé dans le "Back-Office" pour activer le Webservice et générer une clé API. C'est notre "laissez-passer".

2. Apprendre à "parler" à l'API (La communication)
[x] Le traducteur (ApiService) : On a créé le code qui sait dire "Bonjour" à PrestaShop en utilisant l'authentification.

[x] Les deux sens de circulation :

GET pour demander : "Hé, qu'est-ce que tu as en stock ?"

POST pour dire : "Tiens, ajoute ce nouveau produit !"

3. Comprendre le "Plan de Construction" (Le Mapping)
[x] L'espionnage des modèles : On est allé voir sur http://localhost/orig/api pour comprendre comment PrestaShop range ses affaires (les colonnes).

[x] Le choc des formats : On a compris que même si on utilise un fichier CSV (simple), il faut absolument transformer chaque ligne en XML (complexe) pour que PrestaShop accepte de nous écouter.

4. La "Séparation Incroyable" (L'organisation)
[x] Chacun sa boîte : Au lieu de faire un gros tas de code, on a séparé les fonctions : une pour les Produits, une pour les Clients, une pour les Catégories.

[x] L'automatisation : On a créé la logique qui transforme Nom en <name> et Prix en <price> sans qu'on ait à le faire à la main pour chaque ligne.

5. Le Test Final (La Victoire 🚀)
[x] Le "clic" magique : On a chargé un fichier CSV de test, on a cliqué sur "Importer" et on a vu les données apparaître pour de vrai dans le magasin PrestaShop.

