// src/utils/auth.js
// SEM imports. Se você importar router/http/axios aqui, você volta a criar ciclo e o bundle explode.

const TOKEN_KEYS = ['token', 'access_token', 'jwt']

function _getFirstToken() {
  try {
    for (let i = 0; i < TOKEN_KEYS.length; i++) {
      const v = localStorage.getItem(TOKEN_KEYS[i])
      if (v) return v
    }
  } catch (e) {}
  return ''
}

function _removeTokens() {
  try {
    for (let i = 0; i < TOKEN_KEYS.length; i++) {
      localStorage.removeItem(TOKEN_KEYS[i])
    }
  } catch (e) {}
}

export function getToken() {
  return _getFirstToken()
}

export function setToken(token) {
  try {
    // mantém compatibilidade com o que você já usa no backend/interceptors
    localStorage.setItem('token', token || '')
  } catch (e) {}
}

export function getUser() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function setUser(userObj) {
  try {
    localStorage.setItem('user', JSON.stringify(userObj || null))
  } catch (e) {}

  // Notifica AppLayout/Header e outras views
  try {
    window.dispatchEvent(new CustomEvent('user-updated', { detail: userObj || null }))
  } catch (e) {}
}

export function clearAuth() {
  // Limpa tudo relacionado a sessão
  _removeTokens()
  try {
    localStorage.removeItem('user')
    localStorage.removeItem('role')
  } catch (e) {}

  // Notifica UI
  try {
    window.dispatchEvent(new CustomEvent('user-updated', { detail: null }))
  } catch (e) {}
}

export function getRole() {
  try {
    return localStorage.getItem('role') || ''
  } catch (e) {
    return ''
  }
}

export function setRole(role) {
  try {
    localStorage.setItem('role', role || '')
  } catch (e) {}
}

export function isLoggedIn() {
  return !!getToken()
}
