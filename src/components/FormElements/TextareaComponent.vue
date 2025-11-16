<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useFactionStore } from '../../stores/faction'
import { generateWithAi as generateAiContent, isGenerating, hasApiKey } from '../../services/aiService'

const factionStore = useFactionStore()
const model = defineModel()
const textareaRef = ref(null)

const props = defineProps({
  name: String,
  description: String,
  prompt: String
})

function createIdentifier(name) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function adjustHeight() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

onMounted(() => {
  adjustHeight()
})

watch(model, async () => {
  await nextTick()
  adjustHeight()
})

async function generateWithAi() {
  try {
    const text = await generateAiContent(props.prompt)
    model.value = text
    await nextTick()
    adjustHeight()
  } catch (error) {
    // Error already logged in service
  }
}

</script>

<template>
  
  <div class="w-full">
    <div class="flex items-center justify-between mb-2">
      <label :for="createIdentifier(props.name)" class="block text-sm font-medium text-gray-900 dark:text-white">{{ props.name }}</label>
      <button 
        v-if="hasApiKey"
        @click="generateWithAi" 
        :disabled="isGenerating"
        :title="prompt"
        class="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
      >
        <span v-if="!isGenerating">AI</span>
        <span v-else>Generating...</span>
      </button>
    </div>
      <textarea 
        ref="textareaRef"
        :id="createIdentifier(props.name)" 
        v-model="model" 
        @keyup="adjustHeight"
        rows="4" 
        class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 resize-none overflow-hidden" 
        :placeholder="props.description"></textarea>
  </div>
</template>
