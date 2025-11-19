import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFactionStore = defineStore('faction', () => {
  // State
  const version = ref(4)
  const factionName = ref('New Faction')
  const summary = ref('')
  const mastermind = ref('')
  const motivations = ref('')
  const members = ref('')
  const methods = ref('')
  const machinations = ref('')
  const mysteries = ref('')
  const notes = ref('')
  const pyramid = ref({})
  const colorPresets = ref(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'])

  // Load color presets from localStorage on initialization
  const loadColorPresetsFromLocalStorage = () => {
    const saved = localStorage.getItem('factionColorPresets')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 6) {
          colorPresets.value = parsed
        }
      } catch (e) {
        console.error('Failed to load color presets from localStorage', e)
      }
    }
  }

  // Save color presets to localStorage
  const saveColorPresetsToLocalStorage = () => {
    localStorage.setItem('factionColorPresets', JSON.stringify(colorPresets.value))
  }

  // Update color presets
  function updateColorPresets(newPresets) {
    if (Array.isArray(newPresets) && newPresets.length === 6) {
      colorPresets.value = newPresets
      saveColorPresetsToLocalStorage()
    }
  }

  // Actions
  function resetFaction() {
    factionName.value = 'New Faction'
    summary.value = ''
    mastermind.value = ''
    motivations.value = ''
    members.value = ''
    methods.value = ''
    machinations.value = ''
    mysteries.value = ''
    notes.value = ''
    pyramid.value = {}
    // Don't reset color presets - they persist across factions
  }

  function loadFaction(data) {
    version.value = data.version || 4
    factionName.value = data.factionName || 'New Faction'
    summary.value = data.summary || ''
    mastermind.value = data.mastermind || ''
    motivations.value = data.motivations || ''
    members.value = data.members || ''
    methods.value = data.methods || ''
    machinations.value = data.machinations || ''
    mysteries.value = data.mysteries || ''
    notes.value = data.notes || ''
    pyramid.value = data.pyramid || {}
    
    // Load color presets if saved in faction file
    if (data.colorPresets && Array.isArray(data.colorPresets) && data.colorPresets.length === 6) {
      colorPresets.value = data.colorPresets
      saveColorPresetsToLocalStorage()
    }
  }

  function exportFaction() {
    return {
      version: version.value,
      factionName: factionName.value,
      summary: summary.value,
      mastermind: mastermind.value,
      motivations: motivations.value,
      members: members.value,
      methods: methods.value,
      machinations: machinations.value,
      mysteries: mysteries.value,
      notes: notes.value,
      pyramid: pyramid.value,
      colorPresets: colorPresets.value
    }
  }

  // Initialize color presets from localStorage
  loadColorPresetsFromLocalStorage()

  return {
    // State
    version,
    factionName,
    summary,
    mastermind,
    motivations,
    members,
    methods,
    machinations,
    mysteries,
    notes,
    pyramid,
    colorPresets,
    // Actions
    resetFaction,
    loadFaction,
    exportFaction,
    updateColorPresets
  }
})
