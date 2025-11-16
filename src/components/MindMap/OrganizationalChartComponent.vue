<script setup>
import { ref, onMounted, watch } from 'vue'
import UpdateOrganizationNodePopupComponent from '../Popup/UpdateOrganizationNodePopupComponent.vue'
import { useFactionStore } from '../../stores/faction'

const factionStore = useFactionStore()
const chartDiv = ref(null)
let chart = null

// Modal state
const isModalOpen = ref(false)
const modalMode = ref('add') // 'add' or 'edit'
const currentNodeId = ref(null)
const currentParentId = ref(null)

const addNode = (parentId) => {
  modalMode.value = 'add'
  currentParentId.value = parentId
  currentNodeId.value = null
  isModalOpen.value = true
}

const editNode = (nodeId) => {
  if (!factionStore.pyramid || !factionStore.pyramid[nodeId]) return
  
  modalMode.value = 'edit'
  currentNodeId.value = nodeId
  currentParentId.value = null
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const onSaveNode = () => {
  // Redraw chart after save
  drawChart()
}

const onDeleteNode = () => {
  // Redraw chart after delete
  drawChart()
}

const drawChart = () => {
  if (!chartDiv.value) return

  // Wait for Google Charts to be fully loaded
  if (typeof google === 'undefined' || !google.visualization || !google.visualization.OrgChart) {
    setTimeout(drawChart, 100)
    return
  }

  const data = new google.visualization.DataTable()
  data.addColumn('string', 'Name')
  data.addColumn('string', 'Manager')
  data.addColumn('string', 'ToolTip')

  // Helper function to create a row for the chart
  const createChartRow = (nodeId, name, manager, role, description) => {
    const addButton = `<button onclick="event.stopPropagation(); window.addNodeHandler('${nodeId}')" class="bg-blue-500 text-white hover:bg-blue-600" style="margin-left: 8px; padding: 2px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">+</button>`
    const nameSpan = `<div onclick="window.editNodeHandler('${nodeId}')" class="cursor-pointer hover:underline">${name}</div>`
    
    if (role) {
      return [
        { v: nodeId, f: `${nameSpan}<div class="text-gray-400 text-sm italic">${role}</div>${addButton}` },
        manager,
        description
      ]
    } else {
      return [
        { v: nodeId, f: `${nameSpan}${addButton}` },
        manager,
        description
      ]
    }
  }

  // Load data from datamodel.pyramid
  const pyramidData = factionStore.pyramid
  const rows = []

  // Check if pyramid data exists and has nodes
  if (pyramidData && Object.keys(pyramidData).length > 0) {
    // Convert pyramid object to rows format
    for (const [nodeId, nodeData] of Object.entries(pyramidData)) {
      const name = nodeData.name || nodeId
      const manager = nodeData.manager || ''
      const description = nodeData.description || nodeData.role || ''
      const role = nodeData.role || ''
      
      rows.push(createChartRow(nodeId, name, manager, role, description))
    }
  } else {
    // Default sample data if pyramid is empty
    const sampleData = [
      ['Mastermind', '', 'Leader', 'The leader of the faction'],
      ['Lieutenant1', 'Mastermind', 'Second in Command', 'Trusted lieutenant'],
      ['Lieutenant2', 'Mastermind', 'Second in Command', 'Trusted lieutenant'],
      ['Agent1', 'Lieutenant1', '', 'Field operative'],
      ['Agent2', 'Lieutenant1', '', 'Field operative'],
      ['Agent3', 'Lieutenant2', '', 'Field operative'],
      ['Agent4', 'Lieutenant2', '', 'Field operative']
    ]

    sampleData.forEach(([id, manager, role, description]) => {
      const name = id.replace(/([A-Z])/g, ' $1').trim()
      
      rows.push(createChartRow(id, name, manager, role, description))

      // Initialize datamodel with sample data if empty
      if (!factionStore.pyramid[id]) {
        factionStore.pyramid[id] = { name, manager, role, description }
      }
    })
  }

  data.addRows(rows)

  chart = new google.visualization.OrgChart(chartDiv.value)
  chart.draw(data, { 
    allowHtml: true,
    allowCollapse: true,
    size: 'large',
    nodeClass: 'node-default',
    selectedNodeClass: 'node-default-selected'
  })
}

onMounted(() => {
  // Expose addNode function globally for button clicks
  window.addNodeHandler = addNode
  window.editNodeHandler = editNode

  // Load Google Charts - wait for the loader to be available
  const initGoogleCharts = () => {
    if (typeof google !== 'undefined' && google.charts) {
      google.charts.load('current', { packages: ['orgchart'] })
      google.charts.setOnLoadCallback(drawChart)
    } else {
      // If google is not yet loaded, wait and try again
      setTimeout(initGoogleCharts, 100)
    }
  }
  
  initGoogleCharts()
})

// Watch for changes in datamodel if needed
watch(() => factionStore.pyramid, () => {
  drawChart()
}, { deep: true })
</script>

<template>
  <div class="sm:col-span-2">
    <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
      Organization Chart
    </label>
    <div 
      ref="chartDiv" 
      class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[400px]"
    ></div>
    
    <UpdateOrganizationNodePopupComponent 
      :isOpen="isModalOpen"
      :nodeId="currentNodeId"
      :parentId="currentParentId"
      :mode="modalMode"
      @close="closeModal"
      @save="onSaveNode"
      @delete="onDeleteNode"
    />
  </div>
</template>

<style scoped>
:deep(.google-visualization-orgchart-table) {
  border-spacing: 0;
}

:deep(.google-visualization-orgchart-node) {
  border: 1px solid #3b82f6;
  border-radius: 0.5rem;
  background-color: #dbeafe;
  padding: 0.5rem;
  font-family: inherit;
}

:deep(.google-visualization-orgchart-node-medium) {
  min-width: 120px;
}
</style>
