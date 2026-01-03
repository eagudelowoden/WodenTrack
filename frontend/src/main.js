// frontend/src/main.js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // <--- Importa el router con seguridad desde el otro archivo

const app = createApp(App)
app.use(router) // Usa el router que SI tiene el beforeEach
app.mount('#app')