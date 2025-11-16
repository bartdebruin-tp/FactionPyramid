<script setup>
import { ref, onMounted } from 'vue'
import { ArrowDownOnSquareIcon, CloudArrowDownIcon, CloudArrowUpIcon, Cog6ToothIcon } from '@heroicons/vue/24/solid'
import { useFactionStore } from '../../stores/faction'

const emit = defineEmits(['openSettings'])

const factionStore = useFactionStore()
const versions = ref([])
const isVersionHistoryExpanded = ref(false)
const STORAGE_KEY = 'faction-datamodel-versions'
const MAX_VERSIONS = 10

function toggleVersionHistory() {
  isVersionHistoryExpanded.value = !isVersionHistoryExpanded.value
}

function loadVersionsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      versions.value = JSON.parse(stored)
    }
  } catch (err) {
    console.error('Error loading versions from localStorage:', err)
  }
}

function saveVersionsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions.value))
  } catch (err) {
    console.error('Error saving versions to localStorage:', err)
  }
}

function saveDatamodel() {
  // Create a new version with timestamp
  const timestamp = new Date().toISOString()
  const newVersion = {
    timestamp,
    data: factionStore.exportFaction() // Use the store's export method
  }
  
  // Add to beginning of array
  versions.value.unshift(newVersion)
  
  // Keep only the latest 10 versions
  if (versions.value.length > MAX_VERSIONS) {
    versions.value = versions.value.slice(0, MAX_VERSIONS)
  }
  
  // Save to localStorage
  saveVersionsToStorage()
}

function exportDatamodel() {
  // Export the latest version and the last 3 versions (4 total)
  const versionsToExport = versions.value.slice(0, 4)
  
  const exportData = {
    latestVersion: versionsToExport[0] || null,
    previousVersions: versionsToExport.slice(1)
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${factionStore.factionName || 'unknown-faction'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function loadDatamodel() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        try {
          const json = JSON.parse(content)
          factionStore.loadFaction(json.latestVersion.data || {})
          
          // Clear localStorage and version history when loading a new file
          versions.value = []
          localStorage.removeItem(STORAGE_KEY)
        } catch (err) {
          console.error('Error loading datamodel:', err)
          alert('Error loading file')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

function loadVersion(version) {
  if (version && version.data) {
    factionStore.loadFaction(version.data)
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

onMounted(() => {
  loadVersionsFromStorage()
  
  // Load the latest version if available
  if (versions.value.length > 0) {
    loadVersion(versions.value[0])
  }
})
</script>

<template>

<aside class="fixed left-0 top-0 w-80 h-screen">
  <div class="overflow-y-auto py-5 px-3 h-full bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <ul class="space-y-2">
          <li>
              <button @click="saveDatamodel" type="button" class="flex items-center w-full p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <CloudArrowUpIcon class="size-6" />
                  <span class="ml-3">Save Faction</span>
              </button>
          </li>
          <li>
              <button @click="loadDatamodel" type="button" class="flex items-center w-full p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <CloudArrowDownIcon class="size-6" />
                  <span class="ml-3">Load Faction</span>
              </button>
          </li>
          <li>
              <button @click="exportDatamodel" type="button" class="flex items-center w-full p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <ArrowDownOnSquareIcon class="size-6" />
                  <span class="ml-3">Export JSON</span>
              </button>
          </li>
          <li>
              <button @click="alert('Export Mermaid')" type="button" class="flex items-center w-full p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <ArrowDownOnSquareIcon class="size-6" />
                  <span class="ml-3">Export Mermaid</span>
              </button>
          </li>
          <li>
              <button @click="alert('Export Mermaid')" type="button" class="flex items-center w-full p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <ArrowDownOnSquareIcon class="size-6" />
                  <span class="ml-3">Export MarkDown</span>
              </button>
          </li>
          <li>
              <button @click="$emit('openSettings')" type="button" class="flex items-center w-full p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <Cog6ToothIcon class="size-6" />
                  <span class="ml-3">Settings</span>
              </button>
          </li>
          <!-- <li>
              <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <svg aria-hidden="true" class="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z"></path><path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"></path></svg>
                  <span class="flex-1 ml-3 whitespace-nowrap">Messages</span>
                  <span class="inline-flex justify-center items-center w-5 h-5 text-xs font-semibold rounded-full text-primary-800 bg-primary-100 dark:bg-primary-200 dark:text-primary-800">
                      6   
                  </span>
              </a>
          </li>
          <li>
              <button type="button" class="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-controls="dropdown-authentication" data-collapse-toggle="dropdown-authentication">
                  <svg aria-hidden="true" class="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                  <span class="flex-1 ml-3 text-left whitespace-nowrap">Authentication</span>
                  <svg aria-hidden="true" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
              </button>
              <ul id="dropdown-authentication" class="hidden py-2 space-y-2">
                  <li>
                      <a href="#" class="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Sign In</a>
                  </li>
                  <li>
                      <a href="#" class="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Sign Up</a>
                  </li>
                  <li>
                      <a href="#" class="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Forgot Password</a>
                  </li>
              </ul>
          </li> -->
      </ul>
      <div class="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700">
        <button 
          @click="toggleVersionHistory" 
          type="button"
          class="flex items-center justify-between w-full text-sm font-semibold text-gray-500 uppercase dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <span>Version History</span>
          <svg 
            :class="{'rotate-180': isVersionHistoryExpanded}" 
            class="w-4 h-4 transition-transform duration-200" 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
        <ul v-show="isVersionHistoryExpanded" id="version-history" class="space-y-2">
            <li v-if="versions.length === 0" class="p-2 text-sm text-gray-500 dark:text-gray-400">
            No saved versions
            </li>
            <li v-for="(version, index) in versions" :key="version.timestamp">
            <button 
                @click="loadVersion(version)" 
                type="button" 
                class="flex items-center w-full p-2 text-sm font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
            >
                <span class="ml-3">{{ index === 0 ? 'Current: ' : '' }}{{ formatTimestamp(version.timestamp) }}</span>
            </button>
            </li>
        </ul>
        </div>
      <!-- <ul class="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700">
          <li>
              <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                  <svg aria-hidden="true" class="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg>
                  <span class="ml-3">Docs</span>
              </a>
          </li>
          <li>
              <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                  <svg aria-hidden="true" class="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>
                  <span class="ml-3">Components</span>
              </a>
          </li>
          <li>
              <a href="#" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                  <svg aria-hidden="true" class="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clip-rule="evenodd"></path></svg>
                  <span class="ml-3">Help</span>
              </a>
          </li>
      </ul> -->
  </div>
</aside>
</template>