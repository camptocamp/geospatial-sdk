import './assets/main.css'
import 'ol/ol.css'
import 'maplibre-gl/dist/maplibre-gl.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(ui)

app.mount('#app')
