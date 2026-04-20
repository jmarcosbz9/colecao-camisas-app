// src/lib/http.js
//
// Cliente HTTP ÚNICO do projeto.
//
// Metas:
// - Centralizar baseURL (DEV vs PRODUÇÃO).
// - Centralizar JWT no header Authorization.
// - Tratar sessão expirada (401) de forma global, sem "parecer que o modal quebrou":
//   dispara o evento "auth:expired" e deixa o AppLayout exibir toast com botão.
//
// Importante:
// - NÃO fazemos redirect automático aqui.
//   Quem decide é a UI (AppLayout / router guard).

import axios from 'axios'
import { clearAuth } from '../utils/auth'

function pickToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwt') ||
    ''
  )
}

// PRODUÇÃO: mesma origem + IIS/ReverseProxy entrega /api -> Flask
// DEV: Vite em localhost pode chamar backend direto.
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

const api = axios.create({
  baseURL: isLocal ? 'http://localhost:5000' : '',
  timeout: 20000
})

// Request: injeta token e garante upload FormData sem Content-Type fixo
api.interceptors.request.use((config) => {
  const token = pickToken()
  if (token) {
    config.headers = config.headers || {}
    if (!config.headers.Authorization) {
      config.headers.Authorization = 'Bearer ' + token
    }
  }

  // Se for FormData, NÃO force Content-Type.
  // O axios/browser setam multipart/form-data com boundary automaticamente.
  try {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers = config.headers || {}
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }
  } catch (e) {
    // ignore
  }

  return config
})

function shouldIgnore401(config) {
  // 401 no login (credenciais inválidas) NÃO é sessão expirada.
  const url = (config && config.url) ? String(config.url) : ''
  return url.indexOf('/api/auth/login') !== -1
}

function notifyAuthExpiredOnce() {
  try {
    if (sessionStorage.getItem('auth_expired_notified') === '1') return
    sessionStorage.setItem('auth_expired_notified', '1')
  } catch (e) {
    // se sessionStorage não estiver disponível, segue sem throttling
  }

  // Limpa token/user (e dispara evento 'user-updated' internamente, se existir).
  try {
    clearAuth()
  } catch (e) {
    // ignore
  }

  // Evento global para o AppLayout mostrar toast.
  try {
    window.dispatchEvent(new Event('auth:expired'))
  } catch (e) {
    // ignore
  }
}

// Response: trata 401 globalmente (token expirado/ausente/inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error && error.response ? error.response.status : 0
    if (status === 401 && !shouldIgnore401(error.config)) {
      notifyAuthExpiredOnce()
    }

    return Promise.reject(error)
  }
)

export default api
