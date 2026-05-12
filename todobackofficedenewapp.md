Backoffice ( avec login/mdp , mettre par defaut sur le formulaire )
il faut protéger les pages du back office

Je souhaite ajouter un Backoffice protégé par un formulaire de connexion (Login).

Exigences techniques :

Composant Login : Crée un composant LoginView.vue avec un formulaire. Par défaut, remplis les champs avec 'admin' et 'admin123' (v-model).

Séparation des responsabilités : Crée un service AuthService.js pour gérer la logique de connexion et le stockage du token (ou statut connecté) dans le localStorage.

Protection des routes : Utilise vue-router pour protéger toutes les pages sauf le Login. Si l'utilisateur n'est pas connecté, redirige-le vers /login.

Design : Utilise le même style CSS que mon App.vue actuel.

Clean Code : Déclare explicitement les évènements avec emits et utilise des props pour les messages d'erreur, conformément à mes standards de cours (Props validation).
