import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.min.css'

// CSS global necessário para os dropdowns do Header (teleport/menus, hovers, z-index, etc.)
import './styles/global.css'
import router from './router'

// Se tiver router/pinia, descomente e use aqui
// import router from './router'
// import { createPinia } from 'pinia'

const app = createApp(App)
// app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')