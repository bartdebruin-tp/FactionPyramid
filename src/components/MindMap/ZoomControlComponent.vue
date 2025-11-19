<script setup>
import { ref, watch } from 'vue'
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowPathIcon, ViewfinderCircleIcon } from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  minZoom: {
    type: Number,
    default: 0.1
  },
  maxZoom: {
    type: Number,
    default: 3
  },
  zoomStep: {
    type: Number,
    default: 0.1
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'reset', 'resetPan'])

// Local zoom value
const zoomValue = ref(props.modelValue)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  zoomValue.value = newValue
})

// Zoom in
const zoomIn = () => {
  const newZoom = Math.min(zoomValue.value + props.zoomStep, props.maxZoom)
  zoomValue.value = parseFloat(newZoom.toFixed(2))
  emit('update:modelValue', zoomValue.value)
}

// Zoom out
const zoomOut = () => {
  const newZoom = Math.max(zoomValue.value - props.zoomStep, props.minZoom)
  zoomValue.value = parseFloat(newZoom.toFixed(2))
  emit('update:modelValue', zoomValue.value)
}

// Reset zoom to 100%
const resetZoom = () => {
  zoomValue.value = 1
  emit('update:modelValue', 1)
  emit('reset')
}

// Reset pan to center
const resetPan = () => {
  emit('resetPan')
}

// Handle keyboard shortcuts
const handleKeyboard = (e) => {
  // Ctrl/Cmd + Plus/Equals for zoom in
  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
    e.preventDefault()
    zoomIn()
  }
  // Ctrl/Cmd + Minus for zoom out
  else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault()
    zoomOut()
  }
  // Ctrl/Cmd + 0 for reset
  else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault()
    resetZoom()
  }
}

// Expose methods for parent component
defineExpose({
  zoomIn,
  zoomOut,
  resetZoom,
  resetPan,
  handleKeyboard
})
</script>

<template>
  <div class="flex items-center gap-2 bg-white rounded-lg shadow-md p-2 border border-slate-200">
    <!-- Zoom Out Button -->
    <button
      @click="zoomOut"
      :disabled="zoomValue <= minZoom"
      class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title="Zoom Out (Ctrl + -)"
    >
      <MagnifyingGlassMinusIcon class="w-5 h-5 text-slate-700" />
    </button>
    
    <!-- Zoom Level Display -->
    <div class="min-w-16 text-center text-sm font-medium text-slate-700">
      {{ Math.round(zoomValue * 100) }}%
    </div>
    
    <!-- Zoom In Button -->
    <button
      @click="zoomIn"
      :disabled="zoomValue >= maxZoom"
      class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title="Zoom In (Ctrl + +)"
    >
      <MagnifyingGlassPlusIcon class="w-5 h-5 text-slate-700" />
    </button>
    
    <!-- Divider -->
    <div class="w-px h-6 bg-slate-200"></div>
    
    <!-- Reset Zoom Button -->
    <button
      @click="resetZoom"
      :disabled="zoomValue === 1"
      class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title="Reset Zoom (Ctrl + 0)"
    >
      <ArrowPathIcon class="w-5 h-5 text-slate-700" />
    </button>
    
    <!-- Divider -->
    <div class="w-px h-6 bg-slate-200"></div>
    
    <!-- Reset Pan Button -->
    <button
      @click="resetPan"
      class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
      title="Reset to Center"
    >
      <ViewfinderCircleIcon class="w-5 h-5 text-slate-700" />
    </button>
  </div>
</template>
