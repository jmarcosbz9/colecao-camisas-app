// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

// __dirname em ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true })
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)), // robusto em ESM
        // Se preferir, poderia usar:
        // '@': path.resolve(__dirname, 'src'),
      }
    },

    define: {
      __API_BASE__:  JSON.stringify(env.VITE_API_BASE  || '/api'),
      __FILE_BASE__: JSON.stringify(env.VITE_FILE_BASE || '/uploads'),
    },

    server: { port: 5173 },
    build:  {
      outDir: 'dist',
      minify: 'esbuild', // Usar esbuild (padrão, não precisa instalar)
      esbuild: {
        drop: [], // NÃO remover console.logs nem debugger
      }
    }
  }
})
