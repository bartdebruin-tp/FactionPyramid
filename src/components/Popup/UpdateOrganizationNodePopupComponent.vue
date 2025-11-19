<script setup>
import { ref, watch, computed } from 'vue'
import { useFactionStore } from '../../stores/faction'
import BasePopupComponent from './BasePopupComponent.vue'
import ColorPickerComponent from '../FormElements/ColorPickerComponent.vue'

const factionStore = useFactionStore()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  nodeId: {
    type: String,
    default: null
  },
  parentId: {
    type: String,
    default: null
  },
  mode: {
    type: String, // 'add' or 'edit'
    default: 'add'
  }
})

const emit = defineEmits(['close', 'save', 'delete'])

const nodeName = ref('')
const nodeRole = ref('')
const nodeDescription = ref('')
const nodeColor = ref('#3b82f6')

// Computed property for popup title
const popupTitle = computed(() => {
  return props.mode === 'add' ? 'Add Organization Node' : 'Update Organization Node'
})

// Check if the node has children
const hasChildren = () => {
  if (!props.nodeId || !factionStore.pyramid) return false
  
  // Check if any node has this node as its manager
  return Object.entries(factionStore.pyramid).some(([id, node]) => {
    return id !== props.nodeId && node.manager === props.nodeId
  })
}

// Watch for prop changes to update form fields
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.mode === 'edit' && props.nodeId && factionStore.pyramid[props.nodeId]) {
      const currentData = factionStore.pyramid[props.nodeId]
      nodeName.value = currentData.name || ''
      nodeRole.value = currentData.role || ''
      nodeDescription.value = currentData.description || ''
      nodeColor.value = currentData.color || '#3b82f6'
    } else {
      // Reset form for add mode
      nodeName.value = ''
      nodeRole.value = ''
      nodeDescription.value = ''
      nodeColor.value = '#3b82f6'
    }
  }
})

const closeModal = () => {
  emit('close')
}

const saveNode = () => {
  if (!nodeName.value.trim()) {
    alert('Name is required')
    return
  }

  if (!factionStore.pyramid) {
    factionStore.pyramid = {}
  }

  if (props.mode === 'add') {
    // Generate a unique ID
    const newNodeId = `node_${Date.now()}`
    
    factionStore.pyramid[newNodeId] = {
      name: nodeName.value.trim(),
      manager: props.parentId || '',
      role: nodeRole.value.trim(),
      description: nodeDescription.value.trim(),
      color: nodeColor.value
    }
  } else if (props.mode === 'edit' && props.nodeId) {
    // Update existing node
    const currentData = factionStore.pyramid[props.nodeId]
    factionStore.pyramid[props.nodeId] = {
      ...currentData,
      name: nodeName.value.trim(),
      role: nodeRole.value.trim(),
      description: nodeDescription.value.trim(),
      color: nodeColor.value
    }
  }

  emit('save')
  closeModal()
}

const deleteNode = () => {
  if (!props.nodeId) return
  
  // Check if node has children
  if (hasChildren()) {
    alert('Cannot delete this node because it has child nodes underneath it. Please delete or reassign the child nodes first.')
    return
  }
  
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete "${nodeName.value}"?`)) {
    return
  }
  
  // Delete the node from datamodel
  if (factionStore.pyramid && factionStore.pyramid[props.nodeId]) {
    delete factionStore.pyramid[props.nodeId]
  }
  
  emit('delete')
  closeModal()
}
</script>

<template>
  <BasePopupComponent
    :is-open="isOpen"
    :title="popupTitle"
    @close="closeModal"
  >
    <!-- Modal body content -->
    <form @submit.prevent="saveNode">
      <div class="grid gap-4 mb-4 sm:grid-cols-1">
        <div>
          <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name *</label>
          <input 
            v-model="nodeName"
            type="text" 
            name="name" 
            id="name" 
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            placeholder="Enter name"
            required
          >
        </div>
        <div>
          <label for="role" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Role</label>
          <input 
            v-model="nodeRole"
            type="text" 
            name="role" 
            id="role" 
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            placeholder="Enter role (optional)"
          >
        </div>
        <div>
          <label for="description" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
          <textarea 
            v-model="nodeDescription"
            id="description" 
            rows="3" 
            class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            placeholder="Enter description (optional)"
          ></textarea>                    
        </div>
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Node Color</label>
          <ColorPickerComponent 
            v-model="nodeColor"
            label="Color:"
            id="node-color-popup"
            :presetColors="factionStore.colorPresets"
          />
        </div>
      </div>
    </form>

    <!-- Modal actions slot -->
    <template #actions>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center space-x-4">
          <button 
            type="button"
            @click="saveNode"
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
        <button 
          v-if="mode === 'edit'"
          type="button"
          @click="deleteNode"
          class="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        >
          Delete
        </button>
      </div>
    </template>
  </BasePopupComponent>
</template>