import { createRouter, createWebHistory } from 'vue-router'
import { AuthService } from './services/AuthService.js'

const LoginView = () => import('./views/LoginView.vue')
const BackofficeView = () => import('./views/BackofficeView.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      title: 'Connexion - PrestaVue'
    }
  },
  {
    path: '/backoffice',
    name: 'Backoffice',
    component: BackofficeView,
    meta: {
      requiresAuth: true,
      title: 'Backoffice - PrestaVue'
    }
  },
  {
    path: '/',
    redirect: '/backoffice'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/backoffice'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * Guard global pour protéger les routes
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 */
router.beforeEach((to, from, next) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const requiresAuth = to.meta.requiresAuth !== false;

  // Si l'utilisateur est connecté et essaie d'accéder à /login, rediriger vers /backoffice
  if (isAuthenticated && to.path === '/login') {
    next('/backoffice');
    return;
  }

  // Si l'utilisateur n'est pas connecté et la route nécessite l'auth, rediriger vers /login
  if (!isAuthenticated && requiresAuth) {
    next('/login');
    return;
  }

  next();
});

export default router;
