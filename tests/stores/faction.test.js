import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFactionStore } from '@/stores/faction.js'

describe('Faction Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
    expect(store.version).toBe(4)
  })

  it('should reset faction to default values', () => {
    const store = useFactionStore()
    
    // Modify the store
    store.factionName = 'Test Faction'
    store.summary = 'Test Summary'
    store.mastermind = 'Test Mastermind'
    store.pyramid = { level1: 'data' }
    
    // Reset the store
    store.resetFaction()
    
    // Verify default values
    expect(store.factionName).toBe('New Faction')
    expect(store.summary).toBe('')
    expect(store.mastermind).toBe('')
    expect(store.pyramid).toEqual({})
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
      pyramid: { level1: 'Leader', level2: 'Captains' }
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
      pyramid: { test: 'data' }
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
      pyramid: { level: 'data' }
    }
    
    store.loadFaction(originalData)
    const exported = store.exportFaction()
    
    expect(exported).toEqual(originalData)
  })
})
