# Structure et organisation du projet

Vue d’ensemble : une **application Vue 3** servie par **Vite**, qui parle à PrestaShop via son **webservice** (XML + HTTP).

## Arborescence principale

```
PrestaVue/
├── index.html          # Point d’entrée HTML (montage de l’app sur #app)
├── vite.config.js      # Configuration Vite (plugin Vue)
├── package.json        # Scripts npm et dépendances
└── src/
    ├── main.js         # Crée l’app Vue et monte App.vue
    ├── App.vue         # Interface : menus, vues Import / Reset / Dashboard
    ├── App.css         # Styles de l’écran principal
    ├── style.css       # Styles globaux
    └── services/
        ├── ApiService.js    # Couche HTTP : GET / POST / DELETE vers PrestaShop
        ├── ImportService.js # Construit le XML et importe (produits, clients, catégories)
        ├── ResetService.js  # Liste les IDs puis supprime (reset par module)
        └── XmlMappers.js    # Modèles XML (exemple / réutilisable ; non branché dans App.vue)
```

## Rôle de chaque couche

### Point d’entrée (`main.js`)

Charge les styles globaux, importe `App.vue` et l’attache au DOM avec `createApp(App).mount('#app')`.

### Affichage (`App.vue`)

- **Template** : barre latérale (boutons qui changent la « vue »), formulaires CSV, messages de statut.
- **Script (`<script setup>`)** : état (quel écran, fichier chargé, chargement en cours, message d’erreur), lecture du CSV, appels à `ImportService` et `ResetService`.

Toute l’UI métier importante est ici ; il n’y a pas de routeur : le changement d’écran se fait avec une variable `view` (`import` / `reset` / `dashboard`).

### Service API (`ApiService.js`)

Couche **unique** pour parler à PrestaShop :

- **GET** `/{ressource}` — récupère du XML (ex. liste d’IDs avec `?display=[id]`).
- **POST** `/{ressource}` — envoie du XML pour créer une ressource.
- **DELETE** `/{ressource}/{id}` — supprime une ressource.

Authentification : en-tête **Basic** avec la clé webservice (comme attendu par PrestaShop).

### Logique métier

- **`ImportService.js`** : pour chaque ligne CSV, construit un document XML PrestaShop et appelle `ApiService.post` (produits, clients ; la méthode catégories existe aussi dans ce fichier).
- **`ResetService.js`** : récupère les IDs via `ApiService.get`, puis supprime un par un avec `ApiService.delete`. Pour les catégories, les IDs 1 et 2 sont ignorés (souvent racine / défaut).

### Composant exemple (`HelloWorld.vue`)

Modèle fourni par le starter Vite ; **l’application réelle utilise surtout `App.vue`**, pas ce composant.

## Flux données ↔ PrestaShop

1. L’utilisateur choisit un fichier CSV → `App.vue` le lit et remplit un tableau d’objets.
2. **Import** : `ImportService` transforme chaque ligne en XML → **POST** vers l’API.
3. **Reset** : `ResetService` demande la liste des **GET** → **DELETE** pour chaque ID.

Pour aller plus loin (nouveau champ, nouveau module), vous modifiez en général `ImportService` / `ResetService` et les champs attendus dans le parsing CSV de `App.vue`.
