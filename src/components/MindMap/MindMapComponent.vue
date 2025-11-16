<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useFactionStore } from '../../stores/faction'
import UpdateOrganizationNodePopupComponent from '../Popup/UpdateOrganizationNodePopupComponent.vue'
import MindMapToolbarComponent from './MindMapToolbarComponent.vue'
import MindMapTooltipComponent from './MindMapTooltipComponent.vue'
import { CanvasDrawingService } from '../../services/canvasDrawingService'
import { LayoutService } from '../../services/layoutService'

const factionStore = useFactionStore()

const canvasRef = ref(null)
const ctx = ref(null)
const canvasContainer = ref(null)

// Services
let drawingService = null
let layoutService = null

// State management
const nodes = reactive([])
const connections = reactive([])
const selectedNode = ref(null)
const selectedNodes = ref([]) // Array of selected node IDs
const draggingNode = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })
const multiDragOffsets = ref([]) // Store offset for each selected node
const hoveredNode = ref(null)
const canvasSize = reactive({ width: 0, height: 0 })
const editingNode = ref(null)
const editText = ref('')
const inlineInput = ref(null)

// Selection box state
const isSelecting = ref(false)
const selectionBox = reactive({
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

// Modal state
const isModalOpen = ref(false)
const modalMode = ref('add') // 'add' or 'edit'
const currentNodeId = ref(null)
const currentParentId = ref(null)

// Mouse state
const mousePos = reactive({ x: 0, y: 0 })

// Pan/scroll state
const isPanning = ref(false)
const panOffset = reactive({ x: 0, y: 0 })
const panStart = reactive({ x: 0, y: 0 })
const isSpacebarHeld = ref(false)

// Color picker state
const newNodeColor = ref('#3b82f6')

// Tooltip state
const tooltipVisible = ref(false)
const tooltipContent = reactive({ name: '', role: '', description: '' })
const tooltipPos = reactive({ x: 0, y: 0 })
let tooltipTimeout = null

// Grid settings
const GRID_SIZE = 20

let nextNodeId = 1
let isLoadingFromDatamodel = false

// Snap to grid helper functions
const snapToGridHorizontal = (x) => {
  // Snap to center of grid cell
  return Math.round(x / GRID_SIZE) * GRID_SIZE
}

const snapToGridVertical = (y) => {
  // Snap to top of grid cell
  return Math.round(y / GRID_SIZE) * GRID_SIZE
}

onMounted(() => {
  if (canvasRef.value && canvasContainer.value) {
    ctx.value = canvasRef.value.getContext('2d')
    
    // Initialize services
    drawingService = new CanvasDrawingService(ctx.value)
    layoutService = new LayoutService(canvasSize)
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    // Load nodes from datamodel
    loadFromDatamodel()
  }
})
onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// Load nodes from datamodel.pyramid
const loadFromDatamodel = () => {
  isLoadingFromDatamodel = true
  nodes.splice(0, nodes.length)
  connections.splice(0, connections.length)
  
  const pyramidData = factionStore.pyramid
  
  if (!pyramidData || Object.keys(pyramidData).length === 0) {
    // Add initial root node if no data
    addNode(canvasSize.width / 2, canvasSize.height / 2, 'Grand Poobah de Doink of All of This and That', true)
    isLoadingFromDatamodel = false
    return
  }
  
  // Find root nodes (nodes without a manager)
  const nodeMap = new Map()
  const childrenMap = new Map()
  
  // First pass: create all nodes and build relationships
  for (const [nodeId, nodeData] of Object.entries(pyramidData)) {
    nodeMap.set(nodeId, {
      id: nodeId,
      text: nodeData.name || nodeId,
      manager: nodeData.manager || null,
      isRoot: !nodeData.manager
    })
    
    if (!childrenMap.has(nodeId)) {
      childrenMap.set(nodeId, [])
    }
    
    if (nodeData.manager) {
      if (!childrenMap.has(nodeData.manager)) {
        childrenMap.set(nodeData.manager, [])
      }
      childrenMap.get(nodeData.manager).push(nodeId)
    }
  }
  
  // Find root nodes
  const rootNodes = Array.from(nodeMap.values()).filter(n => n.isRoot)
  
  if (rootNodes.length === 0 && nodeMap.size > 0) {
    // If no root found, make first node the root
    const firstNode = Array.from(nodeMap.values())[0]
    firstNode.isRoot = true
    rootNodes.push(firstNode)
  }
  
  // Check if we have saved positions in the datamodel
  const hasSavedPositions = Object.values(pyramidData).some(
    nodeData => nodeData.x !== undefined && nodeData.y !== undefined
  )
  
  let positions
  if (hasSavedPositions) {
    // Use saved positions from datamodel
    positions = new Map()
    for (const [nodeId, nodeData] of Object.entries(pyramidData)) {
      if (nodeData.x !== undefined && nodeData.y !== undefined) {
        positions.set(nodeId, { x: nodeData.x, y: nodeData.y })
      }
    }
  } else {
    // Calculate hierarchical layout if no saved positions
    positions = layoutService.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)
  }
  
  // Create nodes with positions
  for (const [nodeId, pos] of positions.entries()) {
    const nodeInfo = nodeMap.get(nodeId)
    const nodeData = pyramidData[nodeId]
    
    // Calculate dynamic size based on text content
    const { width, height } = drawingService.calculateNodeSize(nodeInfo.text)
    
    const node = {
      id: nodeId,
      x: pos.x,
      y: pos.y,
      width,
      height,
      text: nodeInfo.text,
      isRoot: nodeInfo.isRoot,
      color: nodeData.color || (nodeInfo.isRoot ? '#2563eb' : '#3b82f6')
    }
    nodes.push(node)
  }
  
  // Create connections based on manager relationships
  for (const [nodeId, nodeData] of Object.entries(pyramidData)) {
    if (nodeData.manager) {
      connections.push({ from: nodeData.manager, to: nodeId })
    }
  }
  
  // Update nextNodeId
  const existingIds = Array.from(nodeMap.keys())
  const numericIds = existingIds
    .filter(id => /^node-\d+$/.test(id))
    .map(id => parseInt(id.replace('node-', '')))
  
  if (numericIds.length > 0) {
    nextNodeId = Math.max(...numericIds) + 1
  }
  
  isLoadingFromDatamodel = false
  draw()
}

// Watch for changes in datamodel.pyramid from outside
const syncToDatamodel = () => {
  if (isLoadingFromDatamodel) return
  
  if (!factionStore.pyramid) {
    factionStore.pyramid = {}
  }
  
  // Clear existing pyramid data
  const newPyramid = {}
  
  // Add all current nodes
  nodes.forEach(node => {
    // Find manager (parent) by checking connections
    const parentConnection = connections.find(c => c.to === node.id)
    const manager = parentConnection ? parentConnection.from : null
    
    // Preserve existing data from store if it exists
    const existingData = factionStore.pyramid[node.id] || {}
    
    newPyramid[node.id] = {
      name: node.text,
      manager: manager || '',
      role: existingData.role || '',
      description: existingData.description || '',
      x: node.x,
      y: node.y,
      color: node.color
    }
  })
  
  // Update datamodel
  factionStore.pyramid = newPyramid
}

// Watch for changes in datamodel.pyramid from outside
watch(() => factionStore.pyramid, () => {
  if (!isLoadingFromDatamodel) {
    loadFromDatamodel()
  }
}, { deep: true })


const resizeCanvas = () => {
  if (canvasRef.value && canvasContainer.value) {
    canvasSize.width = canvasContainer.value.clientWidth
    canvasSize.height = canvasContainer.value.clientHeight
    canvasRef.value.width = canvasSize.width
    canvasRef.value.height = canvasSize.height
    
    // Update layout service with new canvas size
    if (layoutService) {
      layoutService.updateCanvasSize(canvasSize.width, canvasSize.height)
    }
    
    draw()
  }
}

const addNode = (x, y, text = 'New Node', isRoot = false) => {
  const nodeId = `node-${nextNodeId++}`
  
  // Calculate dynamic size based on text content
  const { width, height } = drawingService.calculateNodeSize(text)
  
  const node = {
    id: nodeId,
    x,
    y,
    width,
    height,
    text,
    isRoot,
    color: isRoot ? '#2563eb' : newNodeColor.value
  }
  nodes.push(node)
  syncToDatamodel()
  draw()
  return node
}

const addConnection = (fromId, toId) => {
  // Check if connection already exists
  const exists = connections.some(
    c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  )
  if (!exists && fromId !== toId) {
    connections.push({ from: fromId, to: toId })
    syncToDatamodel()
    draw()
  }
}

const getNodeAtPosition = (x, y) => {
  // Adjust for pan offset
  const adjustedX = x - panOffset.x
  const adjustedY = y - panOffset.y
  
  // Check from last to first (top to bottom in rendering)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]
    if (
      adjustedX >= node.x - node.width / 2 &&
      adjustedX <= node.x + node.width / 2 &&
      adjustedY >= node.y - node.height / 2 &&
      adjustedY <= node.y + node.height / 2
    ) {
      return node
    }
  }
  return null
}

const handleCanvasMouseDown = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Middle mouse button for panning
  if (e.button === 1) {
    e.preventDefault()
    isPanning.value = true
    panStart.x = x - panOffset.x
    panStart.y = y - panOffset.y
    return
  }
  
  // Spacebar + left mouse button for panning
  if (isSpacebarHeld.value && e.button === 0) {
    e.preventDefault()
    isPanning.value = true
    panStart.x = x - panOffset.x
    panStart.y = y - panOffset.y
    return
  }
  
  const node = getNodeAtPosition(x, y)
  
  if (e.shiftKey && node) {
    // Shift + click to open edit popup
    openEditModal(node.id)
  } else if (node) {
    // Check if clicked node is in the current selection
    const isInSelection = selectedNodes.value.includes(node.id)
    
    if (isInSelection && selectedNodes.value.length > 1) {
      // Start dragging all selected nodes
      draggingNode.value = node
      // Store offset for each selected node
      multiDragOffsets.value = selectedNodes.value.map(nodeId => {
        const n = nodes.find(nd => nd.id === nodeId)
        return {
          id: nodeId,
          offsetX: x - panOffset.x - n.x,
          offsetY: y - panOffset.y - n.y
        }
      })
    } else {
      // Start dragging single node
      draggingNode.value = node
      selectedNode.value = node
      selectedNodes.value = [node.id] // Replace selection with this node
      dragOffset.x = x - panOffset.x - node.x
      dragOffset.y = y - panOffset.y - node.y
    }
  } else {
    // Start selection box
    isSelecting.value = true
    selectionBox.startX = x - panOffset.x
    selectionBox.startY = y - panOffset.y
    selectionBox.endX = x - panOffset.x
    selectionBox.endY = y - panOffset.y
    // Clear selection
    selectedNode.value = null
    selectedNodes.value = []
  }
  
  draw()
}

const handleCanvasMouseMove = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  mousePos.x = e.clientX - rect.left
  mousePos.y = e.clientY - rect.top
  
  if (isPanning.value) {
    panOffset.x = mousePos.x - panStart.x
    panOffset.y = mousePos.y - panStart.y
    hideTooltip()
    draw()
  } else if (isSelecting.value) {
    // Update selection box end position
    selectionBox.endX = mousePos.x - panOffset.x
    selectionBox.endY = mousePos.y - panOffset.y
    hideTooltip()
    draw()
  } else if (draggingNode.value) {
    if (selectedNodes.value.length > 1 && multiDragOffsets.value.length > 0) {
      // Move all selected nodes together with grid snapping
      multiDragOffsets.value.forEach(offset => {
        const node = nodes.find(n => n.id === offset.id)
        if (node) {
          const rawX = mousePos.x - panOffset.x - offset.offsetX
          const rawY = mousePos.y - panOffset.y - offset.offsetY
          // Snap: center for X, top for Y
          node.x = snapToGridHorizontal(rawX)
          node.y = snapToGridVertical(rawY + node.height / 2) - node.height / 2
        }
      })
    } else {
      // Move single node with grid snapping
      const rawX = mousePos.x - panOffset.x - dragOffset.x
      const rawY = mousePos.y - panOffset.y - dragOffset.y
      // Snap: center for X, top for Y
      draggingNode.value.x = snapToGridHorizontal(rawX)
      draggingNode.value.y = snapToGridVertical(rawY + draggingNode.value.height / 2) - draggingNode.value.height / 2
    }
    hideTooltip()
    draw()
  } else {
    // Update hovered node for cursor feedback
    const node = getNodeAtPosition(mousePos.x, mousePos.y)
    const prevHovered = hoveredNode.value
    hoveredNode.value = node
    
    // Handle tooltip
    if (node && node !== prevHovered) {
      showTooltip(node, e.clientX, e.clientY)
    } else if (!node) {
      hideTooltip()
    }
  }
}

const handleCanvasMouseUp = () => {
  if (draggingNode.value) {
    // Save position after dragging
    syncToDatamodel()
    multiDragOffsets.value = []
  }
  
  if (isSelecting.value) {
    // Finalize selection - find all nodes within selection box
    const minX = Math.min(selectionBox.startX, selectionBox.endX)
    const maxX = Math.max(selectionBox.startX, selectionBox.endX)
    const minY = Math.min(selectionBox.startY, selectionBox.endY)
    const maxY = Math.max(selectionBox.startY, selectionBox.endY)
    
    selectedNodes.value = []
    nodes.forEach(node => {
      // Check if node center is within selection box
      if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
        selectedNodes.value.push(node.id)
      }
    })
    
    // Update selectedNode for toolbar actions
    if (selectedNodes.value.length === 1) {
      selectedNode.value = nodes.find(n => n.id === selectedNodes.value[0])
    } else if (selectedNodes.value.length > 1) {
      selectedNode.value = nodes.find(n => n.id === selectedNodes.value[0])
    }
    
    // Stop selecting before redrawing so selection box disappears
    isSelecting.value = false
    draw()
  }
  
  draggingNode.value = null
  isPanning.value = false
  isSelecting.value = false
}

const handleCanvasMouseLeave = () => {
  hideTooltip()
}

const handleCanvasDoubleClick = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const node = getNodeAtPosition(x, y)
  
  if (node) {
    // Start editing the node
    startEditingNode(node)
  } else {
    // Create new node at click position (accounting for pan offset) with grid snapping
    const rawX = x - panOffset.x
    const rawY = y - panOffset.y
    const snappedX = snapToGridHorizontal(rawX)
    const snappedY = snapToGridVertical(rawY)
    addNode(snappedX, snappedY)
  }
}

const startEditingNode = (node) => {
  editingNode.value = node
  editText.value = node.text
  selectedNode.value = node
  
  // Focus the input on next tick
  setTimeout(() => {
    if (inlineInput.value) {
      inlineInput.value.focus()
      inlineInput.value.select()
    }
  }, 10)
}

const finishEditingNode = () => {
  if (editingNode.value && editText.value.trim()) {
    editingNode.value.text = editText.value.trim()
    
    // Recalculate node size based on new text
    const { width, height } = drawingService.calculateNodeSize(editingNode.value.text)
    editingNode.value.width = width
    editingNode.value.height = height
    
    syncToDatamodel()
    draw()
  }
  editingNode.value = null
  editText.value = ''
}

const cancelEditingNode = () => {
  editingNode.value = null
  editText.value = ''
}

const draw = () => {
  if (!ctx.value || !canvasRef.value || !drawingService) return
  
  const canvas = canvasRef.value
  drawingService.clearCanvas(canvas.width, canvas.height)
  
  // Apply pan offset
  drawingService.applyPanOffset(panOffset)
  
  // Draw connections
  drawingService.drawConnections(connections, nodes)
  
  // Draw selection box if selecting
  if (isSelecting.value) {
    drawingService.drawSelectionBox(selectionBox)
  }
  
  // Draw nodes
  drawingService.drawNodes(nodes, selectedNode.value?.id, hoveredNode.value?.id, selectedNodes.value)
  
  // Restore context
  drawingService.restoreCanvas()
}

const createChildNode = () => {
  if (selectedNode.value) {
    const parent = selectedNode.value
    const angle = Math.random() * Math.PI * 2
    const distance = 150
    const rawX = parent.x + Math.cos(angle) * distance
    const rawY = parent.y + Math.sin(angle) * distance
    
    // Apply grid snapping
    const snappedX = snapToGridHorizontal(rawX)
    const snappedY = snapToGridVertical(rawY)
    
    const newNode = addNode(snappedX, snappedY)
    addConnection(parent.id, newNode.id)
    selectedNode.value = newNode
  }
}

const deleteSelectedNode = () => {
  // Handle multiple selected nodes
  if (selectedNodes.value.length > 1) {
    // Delete all selected nodes
    selectedNodes.value.forEach(nodeId => {
      // Remove connections
      for (let i = connections.length - 1; i >= 0; i--) {
        if (connections[i].from === nodeId || connections[i].to === nodeId) {
          connections.splice(i, 1)
        }
      }
      
      // Remove node
      const index = nodes.findIndex(n => n.id === nodeId)
      if (index !== -1) {
        nodes.splice(index, 1)
      }
    })
    
    selectedNode.value = null
    selectedNodes.value = []
    editingNode.value = null
    syncToDatamodel()
    draw()
  } else if (selectedNode.value && nodes.length > 1) {
    // Single node deletion
    const nodeId = selectedNode.value.id
    
    // Remove connections
    for (let i = connections.length - 1; i >= 0; i--) {
      if (connections[i].from === nodeId || connections[i].to === nodeId) {
        connections.splice(i, 1)
      }
    }
    
    // Remove node
    const index = nodes.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      nodes.splice(index, 1)
    }
    
    selectedNode.value = null
    selectedNodes.value = []
    editingNode.value = null
    syncToDatamodel()
    draw()
  }
}

const updateNodeText = (text) => {
  if (selectedNode.value) {
    selectedNode.value.text = text
    
    // Recalculate node size based on new text
    const { width, height } = drawingService.calculateNodeSize(text)
    selectedNode.value.width = width
    selectedNode.value.height = height
    
    syncToDatamodel()
    draw()
  }
}


const reorganizeLayout = () => {
  if (!layoutService) return
  
  // Build node and children maps
  const { nodeMap, childrenMap } = layoutService.buildNodeMaps(nodes, connections)
  
  // Find root nodes
  const rootNodes = layoutService.findRootNodes(nodes, connections)
  rootNodes.forEach(r => {
    const mapNode = nodeMap.get(r.id)
    if (mapNode) mapNode.isRoot = true
  })
  
  // Calculate new positions
  const positions = layoutService.calculateHierarchicalLayout(
    rootNodes.map(r => nodeMap.get(r.id)),
    nodeMap,
    childrenMap
  )
  
  // Update node positions
  positions.forEach((pos, nodeId) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      node.x = pos.x
      node.y = pos.y
    }
  })
  
  // Save new positions to datamodel
  syncToDatamodel()
  draw()
}

// Keyboard shortcuts
const handleKeyDown = (e) => {
  // Track spacebar for panning
  if (e.code === 'Space' && !editingNode.value) {
    if (!isSpacebarHeld.value) {
      isSpacebarHeld.value = true
      // Change cursor to indicate pan mode is available
      if (canvasRef.value) {
        canvasRef.value.style.cursor = 'grab'
      }
    }
    // Prevent scrolling when spacebar is pressed
    if (e.target === canvasRef.value || e.target === document.body) {
      e.preventDefault()
    }
  }
  
  // Don't process shortcuts if editing
  if (editingNode.value) {
    if (e.key === 'Enter') {
      e.preventDefault()
      finishEditingNode()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditingNode()
    }
    return
  }
  
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedNode.value && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault()
      deleteSelectedNode()
    }
  } else if (e.key === 'Escape') {
    selectedNode.value = null
    selectedNodes.value = []
    draw()
  } else if (e.key === 'Enter' && e.shiftKey && selectedNode.value) {
    createChildNode()
  }
}

const handleKeyUp = (e) => {
  // Release spacebar
  if (e.code === 'Space') {
    isSpacebarHeld.value = false
    // Reset cursor
    if (canvasRef.value && !isPanning.value) {
      canvasRef.value.style.cursor = hoveredNode.value ? 'pointer' : 'default'
    }
  }
}

// Modal functions
const openEditModal = (nodeId) => {
  modalMode.value = 'edit'
  currentNodeId.value = nodeId
  currentParentId.value = null
  isModalOpen.value = true
}

const openAddModal = (parentId) => {
  modalMode.value = 'add'
  currentParentId.value = parentId
  currentNodeId.value = null
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const onSaveNode = () => {
  // Reload from datamodel after save
  loadFromDatamodel()
}

const onDeleteNode = () => {
  // Reload from datamodel after delete
  loadFromDatamodel()
}

// Tooltip functions
const showTooltip = (node, clientX, clientY) => {
  // Clear any existing timeout
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
  }
  
  // Set a delay before showing tooltip
  tooltipTimeout = setTimeout(() => {
    // Get node data from store
    const nodeData = factionStore.pyramid[node.id]
    
    if (nodeData) {
      tooltipContent.name = nodeData.name || node.text
      tooltipContent.role = nodeData.role || ''
      tooltipContent.description = nodeData.description || ''
    } else {
      tooltipContent.name = node.text
      tooltipContent.role = ''
      tooltipContent.description = ''
    }
    
    // Position tooltip near cursor
    tooltipPos.x = clientX + 15
    tooltipPos.y = clientY + 15
    tooltipVisible.value = true
  }, 500) // 500ms delay
}

const hideTooltip = () => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
    tooltipTimeout = null
  }
  tooltipVisible.value = false
}

</script>

<template>
  <div class="mindmap-container">
    <UpdateOrganizationNodePopupComponent 
      :isOpen="isModalOpen"
      :nodeId="currentNodeId"
      :parentId="currentParentId"
      :mode="modalMode"
      @close="closeModal"
      @save="onSaveNode"
      @delete="onDeleteNode"
    />
    
    <MindMapToolbarComponent 
      :hasSelectedNode="!!selectedNode"
      v-model:nodeColor="newNodeColor"
      @addChild="createChildNode"
      @deleteNode="deleteSelectedNode"
      @reorganizeLayout="reorganizeLayout"
    />
    
    <div 
      ref="canvasContainer" 
      class="canvas-container"
    >
      <canvas
        ref="canvasRef"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseLeave"
        @dblclick="handleCanvasDoubleClick"
        @contextmenu.prevent
        :style="{ cursor: isPanning ? 'grabbing' : isSpacebarHeld ? 'grab' : hoveredNode ? 'pointer' : 'default' }"
      ></canvas>
      
      <!-- Inline text editor -->
      <input
        v-if="editingNode"
        type="text"
        v-model="editText"
        @blur="finishEditingNode"
        @keydown.enter.prevent="finishEditingNode"
        @keydown.esc.prevent="cancelEditingNode"
        class="inline-editor"
        :style="{
          left: (editingNode.x + panOffset.x - editingNode.width / 2) + 'px',
          top: (editingNode.y + panOffset.y - editingNode.height / 2) + 'px',
          width: editingNode.width + 'px',
          height: editingNode.height + 'px'
        }"
        ref="inlineInput"
      />
      
      <!-- Tooltip -->
      <MindMapTooltipComponent 
        :visible="tooltipVisible"
        :position="tooltipPos"
        :content="tooltipContent"
      />
    </div>
  </div>
</template>

<style scoped>
.mindmap-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  position: relative;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  background-image: 
    linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  width: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.inline-editor {
  position: absolute;
  padding: 0.5rem;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  font-family: Inter, system-ui, sans-serif;
  text-align: center;
  background: #2563eb;
  color: white;
  outline: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  z-index: 1000;
}

.inline-editor::placeholder {
  color: rgba(255, 255, 255, 0.6);
}
</style>
