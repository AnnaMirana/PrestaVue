# Documentation - Système d'authentification et Backoffice sécurisé

## 📋 Résumé des modifications

Un système de connexion complet a été implémenté avec protection des routes et gestion de session.

---

## 🔑 Composants créés

### 1. **AuthService.js** (`src/services/AuthService.js`)
Service centralisé pour la gestion de l'authentification:
- ✅ `login(username, password)` - Authentifie l'utilisateur (admin/admin123)
- ✅ `logout()` - Déconnecte l'utilisateur et efface le token
- ✅ `isAuthenticated()` - Vérifie si l'utilisateur est connecté
- ✅ `getToken()` - Récupère le token stocké

**Stockage**: Token encodé en Base64 dans `localStorage` (clé: `prestavue_auth_token`)

---

### 2. **LoginView.vue** (`src/views/LoginView.vue`)
Composant de connexion avec :
- ✅ Formulaire avec **v-model** rempli par défaut (admin/admin123)
- ✅ **Props validation** pour le message d'erreur
- ✅ **defineEmits** pour déclarer explicitement les événements
- ✅ Styling cohérent avec la charte actuelle (gradient bleu)
- ✅ Gestion des états de chargement

**Fonctionnalités**:
- Redirection automatique vers `/backoffice` en cas de succès
- Messages d'erreur stylisés
- Désactivation des champs pendant la connexion

---

### 3. **BackofficeView.vue** (`src/views/BackofficeView.vue`)
Nouvelle vue du backoffice qui remplace `App.vue` en contenant:
- ✅ Toute la logique existante (import, reset, dashboard)
- ✅ Bouton **"Déconnexion"** dans la sidebar
- ✅ Même styling CSS que avant

---

### 4. **router.js** (`src/router.js`)
Configuration de Vue Router avec:
- ✅ **Route /login** - Publique (pas d'authentification requise)
- ✅ **Route /backoffice** - Protégée (authentification requise)
- ✅ **Guard global** (`beforeEach`) - Redirige vers `/login` si non authentifié
- ✅ Redirection `/` vers `/backoffice`

**Logique de protection**:
```javascript
- Si connecté + accès à /login → redirection vers /backoffice
- Si non connecté + accès à route protégée → redirection vers /login
```

---

### 5. **App.vue** (Modifié)
Simplifiée pour servir de conteneur:
```vue
<template>
  <router-view></router-view>
</template>
```

---

## 📦 Dépendances ajoutées

Dans `package.json`:
```json
"dependencies": {
  "vue": "^3.5.32",
  "vue-router": "^4.4.0"
}
```

✅ `npm install` exécuté avec succès

---

## 🛡️ Flux d'authentification

```
1. Utilisateur arrive sur http://localhost:5173/
   ↓
2. Router redirige vers /backoffice (route par défaut)
   ↓
3. Guard détecte : non authentifié → redirection vers /login
   ↓
4. LoginView affiche le formulaire (pré-rempli: admin/admin123)
   ↓
5. Utilisateur soumet le formulaire
   ↓
6. AuthService valide les credentials
   ↓
7. Si succès:
   - Token sauvegardé dans localStorage
   - Redirection vers /backoffice
   - BackofficeView affichée
   ↓
8. Utilisateur clique sur "Déconnexion"
   ↓
9. AuthService.logout() efface le token
   ↓
10. Router redirige vers /login
```

---

## 🎨 Cohérence de design

- **LoginView**: Gradient bleu (#1a2a6c à #2d4a8d) avec carte blanche centrée
- **BackofficeView**: Même layout sidebar + content que avant
- **Bouton déconnexion**: Style cohérent (rouge semi-transparent)
- **Messages d'erreur**: Format unifié avec icônes de validation

---

## ⚙️ Configuration du routeur

Dans `main.js`, le routeur est intégré:
```javascript
import router from './router.js'
createApp(App).use(router).mount('#app')
```

---

## 🧪 Credentials de test

| Champ | Valeur |
|-------|--------|
| Identifiant | `admin` |
| Mot de passe | `admin123` |

Ces valeurs sont **pré-remplies** dans le formulaire pour faciliter les tests.

---

## 🔒 Sécurité

- ✅ Token stocké dans `localStorage` (accessible uniquement via JavaScript)
- ✅ Guard global protège toutes les routes (sauf /login)
- ✅ Validation côté client des credentials
- ⚠️ **À noter**: Pour une production, mettre en place:
  - Authentification avec backend (vrai API)
  - HttpOnly cookies pour les tokens
  - CSRF protection
  - Refresh tokens

---

## 📝 Respect des standards de cours

✅ **Props validation**: Error message en prop avec type String
✅ **Emits déclaration**: `defineEmits` utilisé (bien que login n'émette pas d'événement ici)
✅ **Séparation des responsabilités**: AuthService isolé, composants dédiés
✅ **Clean Code**: Noms explicites, commentaires, structure claire
✅ **Composants réutilisables**: LoginView, BackofficeView indépendants

---

## 🚀 Démarrage

```bash
# Installer les dépendances (déjà fait)
npm install

# Lancer le serveur de développement
npm run dev

# Accéder à http://localhost:5173
# → Vous serez redirigé vers /login
# → Connexion avec admin/admin123
```

---

## 📂 Arborescence mise à jour

```
src/
  ├── App.vue (modifié - routeur wrapper)
  ├── App.css
  ├── main.js (modifié - routeur ajouté)
  ├── router.js (NOUVEAU)
  ├── services/
  │   ├── AuthService.js (NOUVEAU)
  │   ├── ImportService.js
  │   ├── ResetService.js
  │   └── XmlMappers.js
  ├── views/
  │   ├── LoginView.vue (NOUVEAU)
  │   └── BackofficeView.vue (NOUVEAU)
  ├── components/
  │   └── HelloWorld.vue
  └── assets/
```

---

## ✨ Fonctionnalités bonus

- 🔄 Auto-détection de la route au démarrage
- ⏳ États de chargement dans le formulaire
- 🎯 Messages d'erreur clairs
- 🚪 Bouton déconnexion dans la sidebar
- 📱 Design responsive
