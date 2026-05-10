# Vue.js — bases utiles pour modifier PrestaVue

Ce projet utilise **Vue 3** avec la **Composition API** et la syntaxe **`<script setup>`** (pas d’`export default` dans le script).

## Les trois parties d’un fichier `.vue`

1. **`<template>`** : HTML avec des directives Vue (`v-if`, `v-model`, etc.).
2. **`<script setup>`** : logique JavaScript (imports, variables réactives, fonctions).
3. **`<style>`** (optionnel) : CSS ; ici beaucoup de styles sont dans `App.css` importé dans le script.

L’ordre peut varier ; l’essentiel est que `template` et `script setup` décrivent la même interface.

## Réactivité : `ref`

Les valeurs affichées dans le template doivent souvent être **réactives** : quand elles changent, l’écran se met à jour.

```js
import { ref } from 'vue';

const message = ref('Bonjour');
message.value = 'Au revoir'; // dans le script : toujours .value
```

Dans le **template**, on écrit `{{ message }}` sans `.value`.

Dans ce projet : `view`, `loading`, `csvData`, `selectedModule`, etc. sont des `ref`.

## Liaison avec le template

| Besoin | Exemple dans PrestaVue |
|--------|-------------------------|
| Afficher une variable | `{{ statusMessage }}` |
| Condition | `v-if="view === 'import'"` |
| Sinon si | `v-else-if`, `v-else` |
| Clic | `@click="handleStartImport"` |
| Lier un champ | `v-model="selectedModule"` sur un `<select>` |
| Classe dynamique | `:class="{ active: view === 'import' }"` |
| Désactiver un bouton | `:disabled="loading"` |

`:` est un raccourci pour `v-bind:` (lier une **expression** à un attribut).

## Événements et méthodes

Les fonctions définies dans `<script setup>` sont utilisables dans le template :

```html
<button @click="handleFileChange">...</button>
```

Pour l’input fichier, `@change="handleFileChange"` reçoit l’événement ; le handler lit `event.target.files`.

## `async` / `await` dans les actions

Les boutons déclenchent des fonctions **async** qui appellent les services :

```js
const handleStartImport = async () => {
  loading.value = true;
  try {
    const count = await ImportService.importProducts(csvData.value);
    // ...
  } finally {
    loading.value = false;
  }
};
```

Règle pratique : mettre à jour `loading` et les messages **après** les appels réseau, dans `try` / `catch` / `finally`.

## Importer des modules

```js
import { ImportService } from './services/ImportService';
import './App.css';
```

Les chemins `./` sont relatifs au fichier `.vue` courant.

## Où modifier quoi (repères)

- **Texte, boutons, mise en page** → `App.vue` (template + styles).
- **Nouveau champ CSV / colonne** → parsing dans `handleFileChange` + champs utilisés dans `ImportService`.
- **URL ou authentification API** → `ApiService.js`.
- **Nouvelle ressource PrestaShop** → nouvelles méthodes dans `ImportService` / `ResetService` + option dans les `<select>` de `App.vue`.

## Pour approfondir

La documentation officielle : [https://vuejs.org/](https://vuejs.org/) — sections « Essentials » (Composition API, `ref`, `computed` si vous en ajoutez plus tard).
