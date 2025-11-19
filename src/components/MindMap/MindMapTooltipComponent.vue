<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  content: {
    type: Object,
    default: () => ({ name: '', role: '', description: '' })
  }
})
</script>

<template>
  <div
    v-if="visible"
    class="tooltip"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px'
    }"
  >
    <div class="tooltip-name">{{ content.name }}</div>
    <div v-if="content.role" class="tooltip-role">{{ content.role }}</div>
    <div v-if="content.description" class="tooltip-text">{{ content.description }}</div>
  </div>
</template>

<style scoped>
.tooltip {
  position: fixed;
  background: #1e293b;
  color: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  pointer-events: none;
  max-width: 300px;
  font-size: 0.875rem;
  line-height: 1.5;
}

.tooltip-name {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.tooltip-role {
  color: #94a3b8;
  font-style: italic;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
}

.tooltip-text {
  color: #cbd5e1;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #475569;
}
</style>
