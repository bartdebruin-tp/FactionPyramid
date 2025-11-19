<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '#3b82f6'
  },
  label: {
    type: String,
    default: 'Color:'
  },
  id: {
    type: String,
    default: 'color-picker'
  },
  presetColors: {
    type: Array,
    default: () => ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  }
})

const emit = defineEmits(['update:modelValue'])

const updateColor = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="color-picker-container">
    <label :for="id" class="color-picker-label">{{ label }}</label>
    <input 
      type="color" 
      :id="id" 
      :value="modelValue"
      @input="updateColor"
      :list="`${id}-presets`"
      class="color-picker"
    />
    
    <datalist :id="`${id}-presets`">
      <option v-for="color in presetColors" :key="color" :value="color"></option>
    </datalist>
  </div>
</template>

<style scoped>
.color-picker-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.color-picker-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.color-picker {
  width: 50px;
  height: 32px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-picker:hover {
  border-color: #94a3b8;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}
</style>
