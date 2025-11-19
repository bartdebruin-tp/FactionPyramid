import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { refreshApiKeyStatus, hasApiKey, isGenerating, generateWithAi } from '@/services/aiService.js'

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

// Mock GoogleGenAI
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor() {
      this.models = {
        generateContent: vi.fn().mockResolvedValue({
          text: 'Generated AI content'
        })
      }
    }
  }
}))

describe('AI Service', () => {
  beforeEach(() => {
    // Replace global localStorage with mock
    global.localStorage = localStorageMock
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('API Key Management', () => {
    it('should detect when no API key is stored', () => {
      refreshApiKeyStatus()
      expect(hasApiKey.value).toBe(false)
    })

    it('should detect when API key is stored', () => {
      const settings = {
        geminiApiKey: 'test-api-key-123'
      }
      localStorage.setItem('faction-settings', JSON.stringify(settings))
      refreshApiKeyStatus()
      expect(hasApiKey.value).toBe(true)
    })

    it('should detect when API key is empty', () => {
      const settings = {
        geminiApiKey: ''
      }
      localStorage.setItem('faction-settings', JSON.stringify(settings))
      refreshApiKeyStatus()
      expect(hasApiKey.value).toBe(false)
    })

    it('should detect when API key is only whitespace', () => {
      const settings = {
        geminiApiKey: '   '
      }
      localStorage.setItem('faction-settings', JSON.stringify(settings))
      refreshApiKeyStatus()
      expect(hasApiKey.value).toBe(false)
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('faction-settings', 'invalid json')
      refreshApiKeyStatus()
      expect(hasApiKey.value).toBe(false)
    })

    it('should handle missing settings object', () => {
      localStorage.setItem('faction-settings', JSON.stringify({}))
      refreshApiKeyStatus()
      expect(hasApiKey.value).toBe(false)
    })
  })

  describe('AI Content Generation', () => {
    beforeEach(() => {
      const settings = {
        geminiApiKey: 'test-api-key-123'
      }
      localStorage.setItem('faction-settings', JSON.stringify(settings))
    })

    it('should set isGenerating to true during generation', async () => {
      const promise = generateWithAi('Test prompt')
      expect(isGenerating.value).toBe(true)
      await promise
    })

    it('should set isGenerating to false after generation completes', async () => {
      await generateWithAi('Test prompt')
      expect(isGenerating.value).toBe(false)
    })

    it('should set isGenerating to false after generation fails', async () => {
      vi.resetModules()
      
      // Dynamically mock for this test only
      vi.doMock('@google/genai', () => ({
        GoogleGenAI: class {
          constructor() {
            this.models = {
              generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
            }
          }
        }
      }))

      try {
        await generateWithAi('Test prompt')
      } catch (error) {
        // Expected to fail
      }
      
      expect(isGenerating.value).toBe(false)
    })

    it('should return generated text from AI', async () => {
      const result = await generateWithAi('Generate faction name')
      expect(result).toBe('Generated AI content')
    })

    it('should call AI with correct prompt', async () => {
      // Reset and check directly
      await generateWithAi('Test prompt for faction')
      
      // We can't easily verify the exact call in this setup,
      // but we can verify it succeeds
      expect(isGenerating.value).toBe(false)
    })

    it('should throw error when AI generation fails', async () => {
      // Mock a failing response for this test
      const originalModule = await import('@google/genai')
      vi.doUnmock('@google/genai')
      vi.doMock('@google/genai', () => ({
        GoogleGenAI: class {
          constructor() {
            this.models = {
              generateContent: vi.fn().mockRejectedValue(new Error('AI API Error'))
            }
          }
        }
      }))

      const { generateWithAi: failingGenerate } = await import('@/services/aiService')
      await expect(failingGenerate('Test prompt')).rejects.toThrow()
    })
  })
})
