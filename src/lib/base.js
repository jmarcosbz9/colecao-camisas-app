// src/lib/base.js
const w = typeof window !== 'undefined' ? window : {}

function normBase(v, fallback) {
  const s = String(v || fallback || '').trim()
  return s.replace(/\/+$/, '') || fallback
}

/** Ordem de resolução:
 *  1) window.__API_BASE__ / window.__FILE_BASE__
 *  2) Vite (.env): VITE_API_BASE / VITE_FILE_BASE
 *  3) fallback seguro
 */
export const API_BASE  = normBase(w.__API_BASE__  || import.meta.env.VITE_API_BASE,  '/api')
export const FILE_BASE = normBase(w.__FILE_BASE__ || import.meta.env.VITE_FILE_BASE, '/uploads')