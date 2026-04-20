<template>
  <div class="app-layout">
    <!-- Modal global: sessão expirada -->
    <div
      v-if="sessionExpired"
      class="sess-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Sessão expirada"
    >
      <div class="sess-card">
        <div class="sess-card__title">Sessão expirada</div>

        <div class="sess-card__body">
          <div class="sess-alert">
            <div class="sess-alert__text">
              {{ sessionExpiredMsg }}
            </div>
          </div>
        </div>

        <div class="sess-card__actions">
          <button class="sess-btn" type="button" @click="goLogin">
            Voltar para o login
          </button>

          <button class="sess-btn" type="button" @click="closeExpired">
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- Header Fixo -->
    <!-- Passamos o contexto calculado dinamicamente -->
    <!-- E o userName recuperado de forma reativa -->
    <Header
      class="app-header"
      :context="context"
      :user-name="userName"
      @search-change="onSearchChange"
      @user-switch="onUserSwitch"
      @user-logout="onUserLogout"
    />

    <!-- Área Principal de Conteúdo -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from './Header.vue'
import { getUser, clearAuth } from '../utils/auth'
import axios from '../lib/axios'

// Router
const router = useRouter()
const route = useRoute()

// Estado Local
const userName = ref('')

// Sessão expirada (401)
const sessionExpired = ref(false)
const sessionExpiredMsg = ref(
  'Por motivos de segurança, sua sessão expirou devido a inatividade.'
)

function showSessionExpired() {
  sessionExpired.value = true
  try {
    sessionStorage.setItem('session_expired', '1')
  } catch (e) {}
}

function handleAuthExpired(e) {
  // se vier mensagem do backend, use ela
  try {
    if (e && e.detail && e.detail.message) {
      sessionExpiredMsg.value = String(e.detail.message)
    }
  } catch (err) {}

  showSessionExpired()
}

// Computed: Contexto baseado na URL (Simples e Infalível)
const context = computed(() => {
  if (route.path.startsWith('/outros')) return 'outros'
  return 'flamengo'
})

// === Gerenciamento de Usuário ===

// Tenta carregar do localStorage ou Backend
async function refreshUser() {
  // 1) cache local
  const localUser = getUser()
  if (localUser && localUser.username) {
    userName.value = localUser.username
    return
  }

  // 2) API
  try {
    const res = await axios.get('/api/auth/me')
    if (res.data && res.data.username) {
      userName.value = res.data.username
    }
  } catch (e) {
    console.debug('Failed to fetch user info', e)
    userName.value = ''
  }
}

// Event Listeners
function handleUserUpdate(e) {
  const u = e.detail
  userName.value = u ? u.username : ''
}

function handleStorage(e) {
  if (e.key === 'user') {
    refreshUser()
  }
}

// Ciclo de Vida
onMounted(() => {
  refreshUser()
  window.addEventListener('user-updated', handleUserUpdate)
  window.addEventListener('storage', handleStorage)

  // restaura flag se a página foi recarregada após 401
  try {
    if (sessionStorage.getItem('session_expired') === '1') {
      sessionExpired.value = true
    }
  } catch (e) {}

  window.addEventListener('auth:expired', handleAuthExpired)
})

onBeforeUnmount(() => {
  window.removeEventListener('user-updated', handleUserUpdate)
  window.removeEventListener('storage', handleStorage)
  window.removeEventListener('auth:expired', handleAuthExpired)
})

// === Ações do modal ===

function closeExpired() {
  try {
    sessionStorage.removeItem('session_expired')
    sessionStorage.removeItem('auth_expired_notified')
  } catch (e) {}

  clearAuth()
  sessionExpired.value = false

  // “Sai” do app
  window.location.replace('about:blank')
}

// === Ações do Header ===

function goLogin() {
  // limpa flags do aviso
  try {
    sessionStorage.removeItem('session_expired')
    sessionStorage.removeItem('auth_expired_notified')
  } catch (e) {}

  // limpa auth e vai pro login
  clearAuth()
  sessionExpired.value = false
  sessionExpiredMsg.value =
    'Por motivos de segurança, sua sessão expirou devido a inatividade.'

  // mantém redirect pra voltar depois do login
  router
    .push({ name: 'login', query: { redirect: route.fullPath } })
    .catch(() => {
      router.push({ name: 'login' })
    })
}

function onUserSwitch() {
  try {
    sessionStorage.removeItem('session_expired')
    sessionStorage.removeItem('auth_expired_notified')
  } catch (e) {}

  clearAuth()
  sessionExpired.value = false
  sessionExpiredMsg.value =
    'Por motivos de segurança, sua sessão expirou devido a inatividade.'

  router
    .push({ name: 'login', query: { redirect: route.fullPath } })
    .catch(() => {
      router.push({ name: 'login' })
    })
}

function onUserLogout() {
  try {
    sessionStorage.removeItem('session_expired')
    sessionStorage.removeItem('auth_expired_notified')
  } catch (e) {}

  clearAuth()
  router.push({ name: 'login' })
}

function onSearchChange(term) {
  const q = String(term || '').trim()

  window.dispatchEvent(
    new CustomEvent('cm-search-change', {
      detail: { term: q, scope: 'global' },
    })
  )

  try {
    const next = { ...route.query }
    if (q) next.q = q
    else delete next.q
    router.replace({ query: next }).catch(() => {})
  } catch (e) {}
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5; /* Fundo base da área logada */
}

.app-header {
  flex: 0 0 auto;
  z-index: 100; /* Header acima do conteúdo */
}

.app-main {
  flex: 1 1 auto;
  position: relative;
}

/* ===============================
   Modal: Sessão Expirada (global)
   =============================== */

.sess-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;      /* meio da tela (vertical) */
  justify-content: center;  /* meio da tela (horizontal) */
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
  z-index: 9999;
}

.sess-card {
  width: min(720px, 92vw);
  background: #fff;
  border-radius: 14px; /* corners rounded */
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
}

.sess-card__title {
  padding: 18px 22px;
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  color: #c00000;
  background: #000000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}

.sess-card__body {
  padding: 22px;
}

.sess-alert {
  background: #f8d7da; /* rosado do print */
  border: 1px solid #f1aeb5;
  border-radius: 10px;
  padding: 18px;
}

.sess-alert__text {
  color: #6b1b22;
  font-size: 16px;
  line-height: 1.35;
}

.sess-card__actions {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 22px 22px;
}

.sess-btn {
  min-width: 190px;
  padding: 12px 18px;
  border-radius: 10px; /* corners rounded */
  border: none;
  cursor: pointer;
  font-weight: 800;

  background: #c00000; /* botão vermelho */
  color: #000;         /* texto preto */

  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
}

.sess-btn:hover {
  filter: brightness(1.02);
}

.sess-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
}

@media (max-width: 520px) {
  .sess-card__actions {
    flex-direction: column;
  }
  .sess-btn {
    width: 100%;
  }
}
</style>