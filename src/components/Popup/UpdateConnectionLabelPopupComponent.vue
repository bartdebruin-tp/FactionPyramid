<script setup>
import { ref, watch } from 'vue'
import BasePopupComponent from './BasePopupComponent.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  connection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const fromLabel = ref('')
const toLabel = ref('')

watch(() => props.connection, (newConnection) => {
  if (newConnection) {
    fromLabel.value = newConnection.fromLabel || ''
    toLabel.value = newConnection.toLabel || ''
  }
}, { immediate: true })

const handleSave = () => {
  emit('save', {
    from: props.connection.from,
    to: props.connection.to,
    fromLabel: fromLabel.value.trim(),
    toLabel: toLabel.value.trim()
  })
  emit('close')
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <BasePopupComponent
    :isOpen="isOpen"
    title="Edit Connection Labels"
    maxWidth="max-w-lg"
    @close="handleClose"
  >
    <form @submit.prevent="handleSave">
      <div class="grid gap-4 mb-4 sm:grid-cols-1">
        <div>
          <label for="fromLabel" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            From Side Label
          </label>
          <input
            id="fromLabel"
            v-model="fromLabel"
            type="text"
            placeholder="Label near source node"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          />
        </div>
        
        <div>
          <label for="toLabel" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            To Side Label
          </label>
          <input
            id="toLabel"
            v-model="toLabel"
            type="text"
            placeholder="Label near target node"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          />
        </div>
      </div>
    </form>

    <template #actions>
      <div class="flex items-center space-x-4">
        <button
          @click="handleSave"
          type="button"
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Save
        </button>
        <button
          @click="handleClose"
          type="button"
          class="text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700"
        >
          Cancel
        </button>
      </div>
    </template>
  </BasePopupComponent>
</template>
