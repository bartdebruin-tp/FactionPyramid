/**
 * Canvas Drawing Service
 * Handles all canvas rendering operations for the mind map
 */

export class CanvasDrawingService {
  constructor(ctx) {
    this.ctx = ctx
  }

  /**
   * Calculate the size needed for a node based on its text content
   */
  calculateNodeSize(text, minWidth = 100, minHeight = 50) {
    // Set font for measurement
    this.ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    
    const padding = 20
    const lineHeight = 18
    const maxWidth = 200 // Maximum width before wrapping
    
    // Split text into words and wrap
    const words = text.split(' ')
    const lines = []
    let currentLine = words[0]
    let maxLineWidth = 0

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i]
      const metrics = this.ctx.measureText(testLine)
      if (metrics.width > maxWidth - padding) {
        lines.push(currentLine)
        maxLineWidth = Math.max(maxLineWidth, this.ctx.measureText(currentLine).width)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    maxLineWidth = Math.max(maxLineWidth, this.ctx.measureText(currentLine).width)
    
    // Calculate dimensions
    const width = Math.max(minWidth, maxLineWidth + padding)
    const height = Math.max(minHeight, lines.length * lineHeight + padding)
    
    return { width, height }
  }

  /**
   * Clear the entire canvas
   */
  clearCanvas(width, height) {
    this.ctx.clearRect(0, 0, width, height)
  }

  /**
   * Draw all connections between nodes
   */
  drawConnections(connections, nodes) {
    this.ctx.strokeStyle = '#64748b'
    this.ctx.lineWidth = 2

    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from)
      const toNode = nodes.find(n => n.id === conn.to)

      if (fromNode && toNode) {
        this.ctx.beginPath()
        this.ctx.moveTo(fromNode.x, fromNode.y)
        this.ctx.lineTo(toNode.x, toNode.y)
        this.ctx.stroke()
      }
    })
  }

  /**
   * Helper function to determine if a color is light or dark
   */
  isLightColor(hexColor) {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
  }

  /**
   * Draw a single node
   */
  drawNode(node, isSelected = false, isHovered = false, isMultiSelected = false) {
    // Shadow for depth
    if (isSelected || isHovered || isMultiSelected) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      this.ctx.shadowBlur = 10
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 4
    }

    // Draw node rectangle with rounded corners
    const x = node.x - node.width / 2
    const y = node.y - node.height / 2
    const radius = 8

    // Always use the node's color, never override it
    this.ctx.fillStyle = node.color
    this.ctx.beginPath()
    this.ctx.roundRect(x, y, node.width, node.height, radius)
    this.ctx.fill()

    // Border - use contrasting color for selected state
    if (isSelected || isMultiSelected) {
      // Choose border color based on node background color
      const isLight = this.isLightColor(node.color)
      this.ctx.strokeStyle = isLight ? '#1e293b' : '#ffffff'
      this.ctx.lineWidth = isMultiSelected ? 3 : 4
    } else {
      this.ctx.strokeStyle = '#1e293b'
      this.ctx.lineWidth = 1
    }
    this.ctx.stroke()

    // Reset shadow
    this.ctx.shadowColor = 'transparent'
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0

    // Draw text
    this.drawNodeText(node)
  }

  /**
   * Draw text inside a node with word wrapping
   */
  drawNodeText(node) {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    // Word wrap text
    const words = node.text.split(' ')
    const lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i]
      const metrics = this.ctx.measureText(testLine)
      if (metrics.width > node.width - 20) {
        lines.push(currentLine)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)

    const lineHeight = 18
    const startY = node.y - ((lines.length - 1) * lineHeight) / 2

    lines.forEach((line, i) => {
      this.ctx.fillText(line, node.x, startY + i * lineHeight)
    })
  }

  /**
   * Draw all nodes
   */
  drawNodes(nodes, selectedNodeId = null, hoveredNodeId = null, selectedNodeIds = []) {
    nodes.forEach(node => {
      const isSelected = selectedNodeId === node.id
      const isHovered = hoveredNodeId === node.id
      const isMultiSelected = selectedNodeIds.includes(node.id) && selectedNodeIds.length > 1
      this.drawNode(node, isSelected, isHovered, isMultiSelected)
    })
  }

  /**
   * Draw selection box
   */
  drawSelectionBox(selectionBox) {
    const x = Math.min(selectionBox.startX, selectionBox.endX)
    const y = Math.min(selectionBox.startY, selectionBox.endY)
    const width = Math.abs(selectionBox.endX - selectionBox.startX)
    const height = Math.abs(selectionBox.endY - selectionBox.startY)

    // Draw filled rectangle with transparency
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    this.ctx.fillRect(x, y, width, height)

    // Draw border
    this.ctx.strokeStyle = '#3b82f6'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    this.ctx.strokeRect(x, y, width, height)
    this.ctx.setLineDash([])
  }

  /**
   * Apply pan offset transformation
   */
  applyPanOffset(panOffset) {
    this.ctx.save()
    this.ctx.translate(panOffset.x, panOffset.y)
  }

  /**
   * Restore canvas state
   */
  restoreCanvas() {
    this.ctx.restore()
  }
}
