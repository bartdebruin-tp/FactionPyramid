import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFactionStore } from '@/stores/faction.js'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

describe('Faction Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.localStorage = localStorageMock
    localStorageMock.clear()
  })

  it('should initialize with default values', () => {
    const store = useFactionStore()
    expect(store.factionName).toBe('New Faction')
    expect(store.summary).toBe('')
    expect(store.mastermind).toBe('')
    expect(store.motivations).toBe('')
    expect(store.members).toBe('')
    expect(store.methods).toBe('')
    expect(store.machinations).toBe('')
    expect(store.mysteries).toBe('')
    expect(store.notes).toBe('')
    expect(store.pyramid).toEqual({})
    expect(store.colorPresets).toEqual(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'])
    expect(store.version).toBe(4)
  })

  it('should reset faction to default values', () => {
    const store = useFactionStore()
    
    // Modify the store
    store.factionName = 'Test Faction'
    store.summary = 'Test Summary'
    store.mastermind = 'Test Mastermind'
    store.pyramid = { level1: 'data' }
    store.colorPresets = ['#000000', '#111111', '#222222', '#333333', '#444444', '#555555']
    
    // Reset the store
    store.resetFaction()
    
    // Verify default values
    expect(store.factionName).toBe('New Faction')
    expect(store.summary).toBe('')
    expect(store.mastermind).toBe('')
    expect(store.pyramid).toEqual({})
    // Color presets should persist across resets
    expect(store.colorPresets).toEqual(['#000000', '#111111', '#222222', '#333333', '#444444', '#555555'])
  })

  it('should load faction data correctly', () => {
    const store = useFactionStore()
    
    const testData = {
      version: 5,
      factionName: 'Dark Brotherhood',
      summary: 'A secret organization',
      mastermind: 'The Night Mother',
      motivations: 'Power and secrecy',
      members: 'Assassins, Scouts',
      methods: 'Stealth and assassination',
      machinations: 'Hidden plots',
      mysteries: 'Unknown origins',
      notes: 'Additional info',
      pyramid: { level1: 'Leader', level2: 'Captains' },
      colorPresets: ['#1a1a1a', '#2b2b2b', '#3c3c3c', '#4d4d4d', '#5e5e5e', '#6f6f6f']
    }
    
    store.loadFaction(testData)
    
    expect(store.version).toBe(5)
    expect(store.factionName).toBe('Dark Brotherhood')
    expect(store.summary).toBe('A secret organization')
    expect(store.mastermind).toBe('The Night Mother')
    expect(store.motivations).toBe('Power and secrecy')
    expect(store.members).toBe('Assassins, Scouts')
    expect(store.methods).toBe('Stealth and assassination')
    expect(store.machinations).toBe('Hidden plots')
    expect(store.mysteries).toBe('Unknown origins')
    expect(store.notes).toBe('Additional info')
    expect(store.pyramid).toEqual({ level1: 'Leader', level2: 'Captains' })
    expect(store.colorPresets).toEqual(['#1a1a1a', '#2b2b2b', '#3c3c3c', '#4d4d4d', '#5e5e5e', '#6f6f6f'])
  })

  it('should load faction with missing data using defaults', () => {
    const store = useFactionStore()
    
    const partialData = {
      factionName: 'Partial Faction',
      summary: 'Some summary'
    }
    
    store.loadFaction(partialData)
    
    expect(store.factionName).toBe('Partial Faction')
    expect(store.summary).toBe('Some summary')
    expect(store.mastermind).toBe('')
    expect(store.version).toBe(4)
    expect(store.pyramid).toEqual({})
  })

  it('should export faction data correctly', () => {
    const store = useFactionStore()
    
    store.factionName = 'Export Test'
    store.summary = 'Test Summary'
    store.mastermind = 'Test Master'
    store.motivations = 'Test Motivations'
    store.pyramid = { test: 'data' }
    
    const exported = store.exportFaction()
    
    expect(exported).toEqual({
      version: 4,
      factionName: 'Export Test',
      summary: 'Test Summary',
      mastermind: 'Test Master',
      motivations: 'Test Motivations',
      members: '',
      methods: '',
      machinations: '',
      mysteries: '',
      notes: '',
      pyramid: { test: 'data' },
      colorPresets: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
    })
  })

  it('should maintain data integrity through export and load cycle', () => {
    const store = useFactionStore()
    
    const originalData = {
      version: 4,
      factionName: 'Cycle Test',
      summary: 'Test Summary',
      mastermind: 'Test Mastermind',
      motivations: 'Test Motivations',
      members: 'Test Members',
      methods: 'Test Methods',
      machinations: 'Test Machinations',
      mysteries: 'Test Mysteries',
      notes: 'Test Notes',
      pyramid: { level: 'data' },
      colorPresets: ['#aabbcc', '#ddeeff', '#112233', '#445566', '#778899', '#aabbcc']
    }
    
    store.loadFaction(originalData)
    const exported = store.exportFaction()
    
    expect(exported).toEqual(originalData)
  })

  it('should update color presets', () => {
    const store = useFactionStore()
    
    const newPresets = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
    store.updateColorPresets(newPresets)
    
    expect(store.colorPresets).toEqual(newPresets)
  })

  it('should save color presets to localStorage when updated', () => {
    const store = useFactionStore()
    
    const newPresets = ['#123456', '#234567', '#345678', '#456789', '#56789a', '#6789ab']
    store.updateColorPresets(newPresets)
    
    const saved = localStorage.getItem('factionColorPresets')
    expect(saved).toBe(JSON.stringify(newPresets))
  })

  it('should not update color presets if array length is not 6', () => {
    const store = useFactionStore()
    const originalPresets = [...store.colorPresets]
    
    store.updateColorPresets(['#ff0000', '#00ff00', '#0000ff']) // Only 3 colors
    
    expect(store.colorPresets).toEqual(originalPresets)
  })

  it('should not update color presets if not an array', () => {
    const store = useFactionStore()
    const originalPresets = [...store.colorPresets]
    
    store.updateColorPresets('not an array')
    
    expect(store.colorPresets).toEqual(originalPresets)
  })

  it('should load color presets from localStorage on initialization', () => {
    const savedPresets = ['#abcdef', '#bcdefg', '#cdefgh', '#defghi', '#efghij', '#fghijk']
    localStorage.setItem('factionColorPresets', JSON.stringify(savedPresets))
    
    // Create a new store instance which will load from localStorage
    setActivePinia(createPinia())
    const store = useFactionStore()
    
    expect(store.colorPresets).toEqual(savedPresets)
  })

  it('should save loaded faction color presets to localStorage', () => {
    const store = useFactionStore()
    
    const testData = {
      factionName: 'Test Faction',
      colorPresets: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666']
    }
    
    store.loadFaction(testData)
    
    const saved = localStorage.getItem('factionColorPresets')
    expect(saved).toBe(JSON.stringify(testData.colorPresets))
  })

  it('should not override color presets if not provided in loaded faction', () => {
    const store = useFactionStore()
    const originalPresets = [...store.colorPresets]
    
    const testData = {
      factionName: 'Test Faction',
      summary: 'Test Summary'
      // No colorPresets provided
    }
    
    store.loadFaction(testData)
    
    expect(store.colorPresets).toEqual(originalPresets)
  })

  it('should handle corrupted localStorage color presets gracefully', () => {
    localStorage.setItem('factionColorPresets', 'invalid json')
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    setActivePinia(createPinia())
    const store = useFactionStore()
    
    // Should fall back to default presets
    expect(store.colorPresets).toEqual(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'])
    
    consoleErrorSpy.mockRestore()
  })

  it('should not load color presets from localStorage if wrong length', () => {
    localStorage.setItem('factionColorPresets', JSON.stringify(['#ff0000', '#00ff00', '#0000ff'])) // Only 3
    
    setActivePinia(createPinia())
    const store = useFactionStore()
    
    // Should use default presets
    expect(store.colorPresets).toEqual(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'])
  })
})
