<script setup>
import { useFactionStore } from '../../stores/faction'
import ColorPickerComponent from '../FormElements/ColorPickerComponent.vue'

const factionStore = useFactionStore()

const props = defineProps({
  hasSelectedNode: {
    type: Boolean,
    default: false
  },
  nodeColor: {
    type: String,
    default: '#3b82f6'
  }
})

const emit = defineEmits(['addChild', 'deleteNode', 'reorganizeLayout', 'update:nodeColor'])
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-section">
      <button @click="emit('addChild')" :disabled="!hasSelectedNode" class="btn btn-primary">
        <span class="icon">+</span>
        Add Child Node
      </button>
      <button @click="emit('deleteNode')" :disabled="!hasSelectedNode" class="btn btn-danger">
        <span class="icon">×</span>
        Delete Node
      </button>
      <button @click="emit('reorganizeLayout')" class="btn btn-secondary">
        <span class="icon">⚡</span>
        Auto Layout
      </button>
      
      <ColorPickerComponent 
        :modelValue="nodeColor"
        label="New Node Color:"
        id="node-color"
        :presetColors="factionStore.colorPresets"
        @update:modelValue="emit('update:nodeColor', $event)"
      />
    </div>
    <div class="instructions">
      <div class="instruction-item">
        <kbd>Double Click</kbd> Edit/Create
      </div>
      <div class="instruction-item">
        <kbd>Shift + Click</kbd> Edit node
      </div>
      <div class="instruction-item">
        <kbd>Middle Click</kbd> Pan view
      </div>
      <div class="instruction-item">
        <kbd>Drag</kbd> Move nodes
      </div>
      <div class="instruction-item">
        <kbd>Shift+Enter</kbd> Add child
      </div>
      <div class="instruction-item">
        <kbd>Del</kbd> Delete
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.instructions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: #64748b;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

kbd {
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #ffffff;
  color: #334155;
}

.btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.icon {
  font-size: 1.25rem;
  line-height: 1;
}
</style>
