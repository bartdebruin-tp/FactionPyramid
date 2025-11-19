import { ref } from 'vue'
import { GoogleGenAI } from '@google/genai'

const SETTINGS_STORAGE_KEY = 'faction-settings'

function getApiKey() {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const settings = JSON.parse(stored)
      return settings.geminiApiKey || ''
    }
  } catch (err) {
    console.error('Error loading API key from localStorage:', err)
  }
  return ''
}

function checkApiKey() {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const settings = JSON.parse(stored)
      return !!(settings.geminiApiKey && settings.geminiApiKey.trim())
    }
  } catch (err) {
    console.error('Error checking API key from localStorage:', err)
  }
  return false
}

const hasApiKey = ref(checkApiKey())
const isGenerating = ref(false)

// Update hasApiKey when storage changes
window.addEventListener('storage', () => {
  hasApiKey.value = checkApiKey()
})

// Also provide a function to manually refresh the API key status
export function refreshApiKeyStatus() {
  hasApiKey.value = checkApiKey()
}

export async function generateWithAi(prompt) {
  try {
    isGenerating.value = true
    const apiKey = getApiKey()
    const ai = new GoogleGenAI({ apiKey })
    console.log('AI Prompt:', prompt)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    })
    return response.text
  } catch (error) {
    console.error('Error generating with AI:', error)
    throw error
  } finally {
    isGenerating.value = false
  }
}

export { isGenerating, hasApiKey }
