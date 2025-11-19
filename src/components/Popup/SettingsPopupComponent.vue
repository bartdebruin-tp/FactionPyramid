<script setup>
import { ref, watch } from 'vue'
import { refreshApiKeyStatus } from '../../services/aiService'
import { useFactionStore } from '../../stores/faction'
import BasePopupComponent from './BasePopupComponent.vue'
import ColorPickerComponent from '../FormElements/ColorPickerComponent.vue'

const factionStore = useFactionStore()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const SETTINGS_STORAGE_KEY = 'faction-settings'
const geminiApiKey = ref('')
const colorPresets = ref([...factionStore.colorPresets])

// Load settings from localStorage
function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const settings = JSON.parse(stored)
      geminiApiKey.value = settings.geminiApiKey || ''
    }
    // Load color presets from store
    colorPresets.value = [...factionStore.colorPresets]
  } catch (err) {
    console.error('Error loading settings from localStorage:', err)
  }
}

// Save settings to localStorage
function saveSettings() {
  try {
    const settings = {
      geminiApiKey: geminiApiKey.value.trim()
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Error saving settings to localStorage:', err)
  }
}

// Watch for popup open/close to load settings
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadSettings()
  }
})

const closeModal = () => {
  emit('close')
}

const saveSettingsAndClose = () => {
  saveSettings()
  refreshApiKeyStatus()
  // Save color presets to store (which also saves to localStorage)
  factionStore.updateColorPresets(colorPresets.value)
  closeModal()
}

const VERSIONS_STORAGE_KEY = 'faction-datamodel-versions'
const COLOR_PRESETS_STORAGE_KEY = 'factionColorPresets'

const clearAllData = () => {
  if (!confirm('Are you sure you want to clear all data? This will reset the faction to its default state, delete all version history, and reset color presets. Only the API key will be preserved.')) {
    return
  }
  
  // Reset to default state using the store's reset method
  factionStore.resetFaction()
  
  // Clear localStorage (keep settings/API key only)
  localStorage.removeItem(VERSIONS_STORAGE_KEY)
  localStorage.removeItem(COLOR_PRESETS_STORAGE_KEY)
  
  // Reset color presets to defaults
  const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  factionStore.updateColorPresets(defaultColors)
  colorPresets.value = [...defaultColors]
  
  closeModal()
}
</script>

<template>
  <BasePopupComponent
    :is-open="isOpen"
    title="Settings"
    @close="closeModal"
  >
    <!-- Modal body content -->
    <form @submit.prevent="saveSettingsAndClose">
      <div class="grid gap-4 mb-4 sm:grid-cols-1">
        <div>
          <label for="geminiApiKey" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Gemini API Key</label>
          <input 
            v-model="geminiApiKey"
            type="text" 
            name="geminiApiKey" 
            id="geminiApiKey" 
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            placeholder="Enter your Gemini API key"
          >
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-blue-600 hover:underline dark:text-blue-500">Google AI Studio</a>
          </p>
        </div>

        <div>
          <label class="block mb-3 text-sm font-medium text-gray-900 dark:text-white">Color Presets for New Nodes</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ColorPickerComponent
              v-for="(color, index) in colorPresets"
              :key="index"
              v-model="colorPresets[index]"
              :label="`Color ${index + 1}`"
              :id="`preset-color-${index}`"
              :presetColors="colorPresets"
            />
          </div>
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            These colors will appear as quick presets in the color picker
          </p>
        </div>

        <div class="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <label class="block mb-2 text-sm font-medium text-red-600 dark:text-red-400">Danger Zone</label>
          <button 
            @click="clearAllData"
            type="button"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Clear All Data
          </button>
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This will reset the faction to default state and delete all version history. This action cannot be undone.
          </p>
        </div>
      </div>
    </form>

    <!-- Modal actions slot -->
    <template #actions>
      <div class="flex items-center space-x-4">
        <button 
          type="button"
          @click="saveSettingsAndClose"
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Save
        </button>
        <button 
          type="button"
          @click="closeModal"
          class="text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700"
        >
          Cancel
        </button>
      </div>
    </template>
  </BasePopupComponent>
</template>