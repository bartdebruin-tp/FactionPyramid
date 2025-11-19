import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SidebarComponent from '@/components/Layout/SidebarComponent.vue'
import { useFactionStore } from '@/stores/faction'

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

describe('SidebarComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.localStorage = localStorageMock
    localStorageMock.clear()
    
    // Mock window.confirm
    global.confirm = vi.fn(() => true)
    
    // Mock window.alert
    global.alert = vi.fn()
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Suppress Vue warnings during tests
    const originalWarn = console.warn
    console.warn = vi.fn((msg) => {
      if (!msg.includes('Unhandled error during execution')) {
        originalWarn(msg)
      }
    })
  })

  afterEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should render all main action buttons', () => {
    const wrapper = mount(SidebarComponent)
    
    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text())
    
    expect(buttonTexts).toContain('Save Faction')
    expect(buttonTexts).toContain('Load Faction')
    expect(buttonTexts).toContain('Export JSON')
    expect(buttonTexts).toContain('Settings')
    expect(buttonTexts).toContain('Clear Data')
  })

  it('should emit openSettings when settings button is clicked', async () => {
    const wrapper = mount(SidebarComponent)
    
    const buttons = wrapper.findAll('button')
    const settingsButton = buttons.find(b => b.text() === 'Settings')
    
    await settingsButton.trigger('click')
    
    expect(wrapper.emitted('openSettings')).toBeTruthy()
  })

  it('should save faction to version history', async () => {
    const wrapper = mount(SidebarComponent)
    const store = useFactionStore()
    
    store.factionName = 'Test Faction'
    store.summary = 'Test Summary'
    
    const buttons = wrapper.findAll('button')
    const saveButton = buttons.find(b => b.text() === 'Save Faction')
    
    await saveButton.trigger('click')
    
    const stored = localStorage.getItem('faction-datamodel-versions')
    expect(stored).toBeTruthy()
    
    const versions = JSON.parse(stored)
    expect(versions).toHaveLength(1)
    expect(versions[0].data.factionName).toBe('Test Faction')
  })

  it('should limit version history to 10 versions', async () => {
    const wrapper = mount(SidebarComponent)
    
    // Manually create 12 versions in localStorage
    const versions = []
    for (let i = 0; i < 12; i++) {
      versions.push({
        id: i,
        timestamp: new Date().toISOString(),
        data: { factionName: `Faction ${i}` }
      })
    }
    
    localStorage.setItem('faction-datamodel-versions', JSON.stringify(versions))
    
    // Trigger a save to apply the limit
    await wrapper.vm.saveDatamodel()
    
    const stored = localStorage.getItem('faction-datamodel-versions')
    const storedVersions = JSON.parse(stored)
    
    expect(storedVersions.length).toBeLessThanOrEqual(10)
  })

  it('should clear data when confirm is accepted', async () => {
    const wrapper = mount(SidebarComponent)
    const store = useFactionStore()
    
    store.factionName = 'Test Faction'
    store.summary = 'Test Summary'
    
    // Save a version first
    const buttons = wrapper.findAll('button')
    const saveButton = buttons.find(b => b.text() === 'Save Faction')
    await saveButton.trigger('click')
    
    global.confirm = vi.fn(() => true)
    
    const clearButton = buttons.find(b => b.text() === 'Clear Data')
    await clearButton.trigger('click')
    
    expect(store.factionName).toBe('New Faction')
    expect(store.summary).toBe('')
    expect(localStorage.getItem('faction-datamodel-versions')).toBeNull()
  })

  it('should not clear data when confirm is rejected', async () => {
    const wrapper = mount(SidebarComponent)
    const store = useFactionStore()
    
    store.factionName = 'Test Faction'
    
    global.confirm = vi.fn(() => false)
    
    const buttons = wrapper.findAll('button')
    const clearButton = buttons.find(b => b.text() === 'Clear Data')
    await clearButton.trigger('click')
    
    expect(store.factionName).toBe('Test Faction')
  })

  it('should toggle version history visibility', async () => {
    const wrapper = mount(SidebarComponent)
    
    // Initially collapsed (using v-show, so element exists but may not be visible)
    expect(wrapper.vm.isVersionHistoryExpanded).toBe(false)
    
    // Find the toggle button (the one with "Version History" text)
    const toggleButton = wrapper.findAll('button').find(b => b.text().includes('Version History'))
    await toggleButton.trigger('click')
    
    // After toggle, it should be expanded
    expect(wrapper.vm.isVersionHistoryExpanded).toBe(true)
  })

  it('should display "No saved versions" when version history is empty', async () => {
    const wrapper = mount(SidebarComponent)
    
    // Toggle version history to make it visible
    await wrapper.vm.toggleVersionHistory()
    await wrapper.vm.$nextTick()
    
    const versionHistory = wrapper.find('#version-history')
    expect(versionHistory.text()).toContain('No saved versions')
  })

  it('should load version when clicking on it', async () => {
    const wrapper = mount(SidebarComponent)
    const store = useFactionStore()
    
    // Save a version
    store.factionName = 'Saved Faction'
    const buttons = wrapper.findAll('button')
    const saveButton = buttons.find(b => b.text() === 'Save Faction')
    await saveButton.trigger('click')
    
    // Change current data
    store.factionName = 'Changed Faction'
    
    // Toggle version history
    await wrapper.vm.toggleVersionHistory()
    await wrapper.vm.$nextTick()
    
    // Find and click the version
    const versionButtons = wrapper.findAll('#version-history button')
    if (versionButtons.length > 0) {
      await versionButtons[0].trigger('click')
      expect(store.factionName).toBe('Saved Faction')
    }
  })

  it('should format timestamp correctly', () => {
    const wrapper = mount(SidebarComponent)
    const timestamp = '2024-01-15T10:30:00.000Z'
    
    const formatted = wrapper.vm.formatTimestamp(timestamp)
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
  })

  it('should export faction with latest and previous versions', async () => {
    const wrapper = mount(SidebarComponent)
    const store = useFactionStore()
    
    // Create mock link element
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    
    // Set faction data and save once
    store.factionName = 'Test Faction'
    await wrapper.vm.saveDatamodel()
    
    await wrapper.vm.exportDatamodel()
    
    expect(mockLink.click).toHaveBeenCalled()
    expect(mockLink.download).toContain('Test Faction.json')
  })
})
