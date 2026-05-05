<template>
  <div class="login-container">
    <!-- Lado Esquerdo: Formulário -->
    <div class="login-left">
      <div class="login-box">
        <header class="login-header">
          <img
            src="/icones/varal-camisas.png"
            alt="Varal de camisas"
            class="brand-varal"
          />
          <h1>Coleção de Camisas</h1>
          <p>Entre com suas credenciais</p>
        </header>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Usuário</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Digite seu usuário"
              required
              :disabled="loading"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Digite sua senha"
              required
              :disabled="loading"
              autocomplete="current-password"
            />
          </div>

          <div v-if="errorMsg" class="alert error">
            {{ errorMsg }}
          </div>

          <button type="submit" class="btn-login" :disabled="loading">
            <span v-if="loading">Entrando...</span>
            <span v-else>Entrar</span>
          </button>
        </form>

        <!-- Credenciais de teste removidas -->
      </div>
    </div>

    <!-- Lado Direito: Imagem -->
    <div class="login-right">
      <img
        src="/icones/O_Camisa_10_da_Gávea.jpg"
        alt="O Camisa 10 da Gávea"
        class="hero-image"
      />
      <div class="overlay"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '../lib/http'
import { setToken, setUser } from '../utils/auth'

const router = useRouter()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    const res = await http.post('/api/auth/login', form.value)
    const { access_token, user } = res.data

    setToken(access_token)
    setUser(user)

    await new Promise(r => setTimeout(r, 50))
    router.push({ name: 'flamengo' })
  } catch (err) {
    console.error('Login error', err)
    if (err.response) {
      if (err.response.status === 401) {
        errorMsg.value = 'Usuário ou senha inválidos.'
      } else {
        errorMsg.value = err.response.data?.error || 'Erro no servidor.'
      }
    } else {
      errorMsg.value = 'Erro de conexão. Verifique se o backend está rodando.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Garantir encaixe “desktop” sem scroll indesejado */
.login-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', Roboto, sans-serif;
}

/* --- Lado Esquerdo (Form) --- */
.login-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 2.5vw, 40px);

/* Gradiente vertical: vermelho sólido -> vermelho claro -> preto sólido -> cinza */
    background: linear-gradient(
	  180deg,
	  #c40000 0%,
	  #ff4b4b 40%,
	  #000000 50%,
	  #000000 65%,
	  #cfcfcf 100%
	);
}

.login-box {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 22px;
}

.brand-varal {
  display: block;
  margin: 0 auto 14px;
  width: min(320px, 90%);
  height: auto;
}

.login-header h1 {
  margin: 0;
  font-size: 1.9rem;
  color: #111;
}

.login-header p {
  color: #666;
  margin: 6px 0 0;
}

.form-group {
  margin-bottom: 1.1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.45rem;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #e11d2f;
  outline: none;
}

.btn-login {
  width: 100%;
  padding: 12px;
  background: #000;
  color: #c00000;
  border: none;
  border-radius: 8px;
  font-size: 1.20rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-login:hover:not(:disabled) {
  background: #111;
}

.btn-login:disabled {
  background: #444;
  color: #b22;
  cursor: not-allowed;
}

.alert.error {
  color: #d32f2f;
  background: #ffebee;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

/* --- Lado Direito (Imagem) --- */
.login-right {
  flex: 1.15;
  position: relative;
  /* Mesmo gradiente do lado esquerdo: aparece nas laterais com contain */
  background: linear-gradient(
    180deg,
    #c40000 0%,
    #ff4b4b 40%,
    #000000 50%,
    #000000 65%,
    #cfcfcf 100%
  );
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right center;
}

.overlay {
  position: absolute;
  inset: 0;
  background: transparent;
}

/* Compacta o formulário em telas baixas (inclui 1366x768) */
@media (max-height: 800px) {
  .login-left {
    padding: 14px;
  }

  .login-box {
    padding: 18px;
    max-width: 420px;
  }

  .brand-varal {
    margin: 0 auto 8px;
    width: min(240px, 90%);
  }

  .login-header {
    margin-bottom: 12px;
  }

  .login-header h1 {
    font-size: 1.45rem;
  }

  .login-header p {
    margin-top: 4px;
    font-size: 0.92rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group input {
    padding: 10px;
  }

  .btn-login {
    padding: 10px;
  }

}
</style>
