# changement.md

## Modifications appliquées

### 1) `src/services/ApiService.js`
- Modification de `post(resource, xmlData)`.
- Avant : `post()` renvoyait uniquement un booléen `response.ok`.
- Maintenant : `post()` renvoie un objet `{ ok, status, text }` où `text` est le XML brut renvoyé par PrestaShop.
- But : permettre l’extraction du `<id>` (via `DOMParser`) après le POST `/customers`.

### 2) `src/services/ImportService.js`
- Ajout de `importComplexCustomer(data)` (async/await).
- Logique :
  1. POST `/customers` pour créer le client.
  2. Parsing de la réponse XML avec `DOMParser` pour extraire l’ID (`<id>` ou `<id_customer>`).
  3. Si ID trouvé : POST `/addresses` avec `id_customer` et `id_country` par défaut = `1`.
  4. Sécurité : si la création du client échoue, **aucune** création d’adresse n’est tentée et une erreur explicite est levée.
- Clean Code / ITU :
  - Helpers privés pour construire le XML.
  - Encapsulation des champs sensibles en `<![CDATA[ ... ]]>`.
  - Normalisation des valeurs (pas de `undefined` dans le XML).

## Commande de build
- `npm run build --silent`
