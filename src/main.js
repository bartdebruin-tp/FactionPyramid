import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import TextareaComponent from './components/FormElements/TextareaComponent.vue'
import SidebarComponent from './components/Layout/SidebarComponent.vue'
import MindMapComponent from './components/MindMap/MindMapComponent.vue'
import { useFactionStore } from './stores/faction'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Make useFactionStore globally available
app.config.globalProperties.$useFactionStore = useFactionStore

app
  .component('SidebarComponent', SidebarComponent)
  .component('TextareaComponent', TextareaComponent)
  .component('MindMapComponent', MindMapComponent)

app.mount('#app')