# Installation et exécution

## Prérequis

- **Node.js** (version LTS recommandée), qui inclut `npm`.
- Une boutique **PrestaShop** avec l’**API webservice** activée, accessible depuis votre machine (souvent en local pour le développement).

## Installer les dépendances

À la racine du projet (`PrestaVue`) :

```bash
npm install
```

Cela installe Vue 3, Vite et le plugin Vue pour Vite, selon le `package.json`.

## Lancer le projet en développement

```bash
npm run dev
```

Vite démarre un serveur local (l’URL s’affiche dans le terminal, en général `http://localhost:5173`). Ouvrez-la dans le navigateur.

## Autres commandes utiles

| Commande        | Rôle                                      |
|-----------------|-------------------------------------------|
| `npm run build` | Génère les fichiers de production dans `dist/`. |
| `npm run preview` | Sert le contenu de `dist/` pour tester le build. |

## Lier l’app à PrestaShop

Les appels API sont définis dans `src/services/ApiService.js` :

- **`BASE_URL`** : URL de base de l’API (ex. `http://localhost/orig/api` — à adapter à votre installation).
- **`API_KEY`** : clé du webservice PrestaShop.

Modifiez ces valeurs pour qu’elles correspondent à **votre** boutique. En production, évitez de committer une vraie clé : utilisez des variables d’environnement si possible.

## Problèmes fréquents

- **Erreurs réseau / CORS** : le navigateur appelle directement PrestaShop. Il faut que PrestaShop autorise l’origine de votre app (Vite) ou que vous passiez par un proxy ; sinon le navigateur bloque la requête.
- **401 / refus d’accès** : vérifiez la clé API et les droits du webservice dans le back-office PrestaShop.
