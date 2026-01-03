import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MarcacionView from '../views/MarcacionView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/marcacion', name: 'Marcacion', component: MarcacionView },
  { path: '/admin', name: 'Admin', component: AdminView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const session = JSON.parse(localStorage.getItem('user_session'));

  // 1. Si intenta ir a marcación o admin sin sesión -> al Login
  if ((to.path === '/marcacion' || to.path === '/admin') && !session) {
    next('/login');
  } 
  // 2. Si ya está logueado e intenta ir al Login -> lo mandamos a su panel
  else if (to.path === '/login' && session) {
    if (session.role === 'admin') next('/admin');
    else next('/marcacion');
  } 
  else {
    next();
  }
});

export default router;