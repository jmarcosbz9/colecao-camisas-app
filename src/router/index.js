/**
 * src/router/index.js
 * Simple routing configuration without authentication
 */
import { createRouter, createWebHistory } from 'vue-router'

// Views
import Login from '../views/Login.vue'
import FlaGrid from '../views/FlaGrid.vue'
import OutrosTimesGrid from '../views/OutrosTimesGrid.vue'

// Layout
import AppLayout from '../components/AppLayout.vue'

const routes = [
  // Login sem header
  { path: '/login', name: 'login', component: Login },

  // Layout com Header/Breadcrumb etc
  {
    path: '/',
    component: AppLayout,
    children: [
      // ANTES: { path: '', redirect: '/flamengo' },
      // AGORA:
      { path: '', redirect: '/login' },

      { path: 'flamengo', name: 'flamengo', component: FlaGrid },
      { path: 'outros_times', name: 'outros_times', component: OutrosTimesGrid },
    ]
  },

  // Fallback: redirect unknown paths to Flamengo
  {
    path: '/:pathMatch(.*)*',
    redirect: '/flamengo'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
