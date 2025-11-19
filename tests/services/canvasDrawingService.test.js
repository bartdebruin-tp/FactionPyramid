import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CanvasDrawingService } from '@/services/canvasDrawingService.js'

describe('CanvasDrawingService', () => {
  let mockCtx
  let service

  beforeEach(() => {
    // Create a mock canvas context
    mockCtx = {
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      roundRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      measureText: vi.fn((text) => ({ width: text.length * 8 })) // Mock measurement
    }
    
    service = new CanvasDrawingService(mockCtx)
  })

  describe('calculateNodeSize', () => {
    it('should calculate size for short text', () => {
      const size = service.calculateNodeSize('Test')
      expect(size.width).toBeGreaterThanOrEqual(100) // minWidth
      expect(size.height).toBeGreaterThanOrEqual(50) // minHeight
    })

    it('should wrap long text and increase height', () => {
      const longText = 'This is a very long text that should definitely wrap to multiple lines when rendered on the canvas'
      const size = service.calculateNodeSize(longText)
      expect(size.height).toBeGreaterThan(50)
    })

    it('should respect minimum width', () => {
      const size = service.calculateNodeSize('A', 150, 50)
      expect(size.width).toBe(150)
    })

    it('should respect minimum height', () => {
      const size = service.calculateNodeSize('A', 100, 80)
      expect(size.height).toBe(80)
    })

    it('should handle empty text', () => {
      const size = service.calculateNodeSize('')
      expect(size.width).toBeGreaterThanOrEqual(100)
      expect(size.height).toBeGreaterThanOrEqual(50)
    })
  })

  describe('clearCanvas', () => {
    it('should clear the entire canvas area', () => {
      service.clearCanvas(800, 600)
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('isLightColor', () => {
    it('should identify white as light', () => {
      expect(service.isLightColor('#ffffff')).toBe(true)
    })

    it('should identify black as dark', () => {
      expect(service.isLightColor('#000000')).toBe(false)
    })

    it('should identify light gray as light', () => {
      expect(service.isLightColor('#cccccc')).toBe(true)
    })

    it('should identify dark gray as dark', () => {
      expect(service.isLightColor('#333333')).toBe(false)
    })

    it('should handle colors without # prefix', () => {
      expect(service.isLightColor('ffffff')).toBe(true)
    })
  })

  describe('drawConnections', () => {
    it('should draw connections between nodes', () => {
      const nodes = [
        { id: 1, x: 100, y: 100 },
        { id: 2, x: 200, y: 200 }
      ]
      const connections = [
        { from: 1, to: 2 }
      ]

      service.drawConnections(connections, nodes)

      expect(mockCtx.beginPath).toHaveBeenCalled()
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100)
      expect(mockCtx.lineTo).toHaveBeenCalledWith(200, 200)
      expect(mockCtx.stroke).toHaveBeenCalled()
    })

    it('should skip connections with missing nodes', () => {
      const nodes = [{ id: 1, x: 100, y: 100 }]
      const connections = [{ from: 1, to: 99 }]

      service.drawConnections(connections, nodes)

      expect(mockCtx.moveTo).not.toHaveBeenCalled()
    })

    it('should draw connection labels when present', () => {
      const nodes = [
        { id: 1, x: 100, y: 100 },
        { id: 2, x: 200, y: 200 }
      ]
      const connections = [
        { from: 1, to: 2, fromLabel: 'Parent', toLabel: 'Child' }
      ]

      service.drawConnections(connections, nodes)

      expect(mockCtx.fillText).toHaveBeenCalled()
      expect(mockCtx.save).toHaveBeenCalled()
      expect(mockCtx.restore).toHaveBeenCalled()
    })

    it('should handle empty connections array', () => {
      service.drawConnections([], [])
      expect(mockCtx.beginPath).not.toHaveBeenCalled()
    })
  })

  describe('drawConnectionLabels', () => {
    const fromNode = { id: 1, x: 100, y: 100 }
    const toNode = { id: 2, x: 300, y: 200 }

    it('should draw from label', () => {
      const connection = { from: 1, to: 2, fromLabel: 'Parent' }
      service.drawConnectionLabels(connection, fromNode, toNode)

      expect(mockCtx.fillText).toHaveBeenCalled()
      expect(mockCtx.translate).toHaveBeenCalled()
      expect(mockCtx.rotate).toHaveBeenCalled()
    })

    it('should draw to label', () => {
      const connection = { from: 1, to: 2, toLabel: 'Child' }
      service.drawConnectionLabels(connection, fromNode, toNode)

      expect(mockCtx.fillText).toHaveBeenCalled()
    })

    it('should draw both labels', () => {
      const connection = { from: 1, to: 2, fromLabel: 'Parent', toLabel: 'Child' }
      service.drawConnectionLabels(connection, fromNode, toNode)

      expect(mockCtx.fillText).toHaveBeenCalledTimes(2)
    })

    it('should flip text for left-pointing connections', () => {
      const leftNode = { id: 1, x: 300, y: 100 }
      const rightNode = { id: 2, x: 100, y: 100 }
      const connection = { from: 1, to: 2, fromLabel: 'Test' }
      
      service.drawConnectionLabels(connection, leftNode, rightNode)

      expect(mockCtx.rotate).toHaveBeenCalled()
    })
  })

  describe('drawNode', () => {
    const node = {
      id: 1,
      x: 200,
      y: 150,
      width: 120,
      height: 60,
      color: '#ffffff',
      text: 'Test Node'
    }

    it('should draw a basic node', () => {
      service.drawNode(node)

      expect(mockCtx.fillStyle).toBe('#ffffff')
      expect(mockCtx.roundRect).toHaveBeenCalled()
      expect(mockCtx.fill).toHaveBeenCalled()
      expect(mockCtx.stroke).toHaveBeenCalled()
    })

    it('should apply and reset shadow for selected node', () => {
      // Track shadow changes
      let shadowWasSet = false
      const originalSetter = Object.getOwnPropertyDescriptor(mockCtx, 'shadowBlur')
      Object.defineProperty(mockCtx, 'shadowBlur', {
        set: function(value) {
          if (value > 0) shadowWasSet = true
          this._shadowBlur = value
        },
        get: function() {
          return this._shadowBlur || 0
        },
        configurable: true
      })

      service.drawNode(node, true)

      expect(shadowWasSet).toBe(true)
      expect(mockCtx.shadowBlur).toBe(0) // Should be reset after drawing
    })

    it('should apply and reset shadow for hovered node', () => {
      let shadowWasSet = false
      Object.defineProperty(mockCtx, 'shadowBlur', {
        set: function(value) {
          if (value > 0) shadowWasSet = true
          this._shadowBlur = value
        },
        get: function() {
          return this._shadowBlur || 0
        },
        configurable: true
      })

      service.drawNode(node, false, true)

      expect(shadowWasSet).toBe(true)
      expect(mockCtx.shadowBlur).toBe(0)
    })

    it('should apply and reset shadow for multi-selected node', () => {
      let shadowWasSet = false
      Object.defineProperty(mockCtx, 'shadowBlur', {
        set: function(value) {
          if (value > 0) shadowWasSet = true
          this._shadowBlur = value
        },
        get: function() {
          return this._shadowBlur || 0
        },
        configurable: true
      })

      service.drawNode(node, false, false, true)

      expect(shadowWasSet).toBe(true)
      expect(mockCtx.shadowBlur).toBe(0)
    })

    it('should use different border width for selected vs multi-selected', () => {
      service.drawNode(node, true)
      const selectedLineWidth = mockCtx.lineWidth

      mockCtx.lineWidth = 0
      service.drawNode(node, false, false, true)
      const multiSelectedLineWidth = mockCtx.lineWidth

      expect(selectedLineWidth).not.toBe(multiSelectedLineWidth)
    })

    it('should use contrasting border color based on node color', () => {
      const lightNode = { ...node, color: '#ffffff' }
      service.drawNode(lightNode, true)
      const lightBorderColor = mockCtx.strokeStyle

      const darkNode = { ...node, color: '#000000' }
      service.drawNode(darkNode, true)
      const darkBorderColor = mockCtx.strokeStyle

      expect(lightBorderColor).not.toBe(darkBorderColor)
    })

    it('should reset shadow after drawing', () => {
      service.drawNode(node, true)

      expect(mockCtx.shadowColor).toBe('transparent')
      expect(mockCtx.shadowBlur).toBe(0)
    })
  })

  describe('drawNodeText', () => {
    it('should draw single line text', () => {
      const node = {
        x: 200,
        y: 150,
        width: 120,
        height: 60,
        text: 'Short'
      }

      service.drawNodeText(node)

      expect(mockCtx.fillText).toHaveBeenCalledWith('Short', 200, 150)
    })

    it('should wrap long text to multiple lines', () => {
      const node = {
        x: 200,
        y: 150,
        width: 100,
        text: 'This is a very long text that should wrap'
      }

      service.drawNodeText(node)

      // Should be called more than once for wrapped text
      expect(mockCtx.fillText.mock.calls.length).toBeGreaterThan(1)
    })

    it('should center text horizontally and vertically', () => {
      const node = {
        x: 200,
        y: 150,
        width: 120,
        height: 60,
        text: 'Test'
      }

      service.drawNodeText(node)

      expect(mockCtx.textAlign).toBe('center')
      expect(mockCtx.textBaseline).toBe('middle')
    })
  })

  describe('drawNodes', () => {
    const nodes = [
      { id: 1, x: 100, y: 100, width: 100, height: 50, color: '#3b82f6', text: 'Node 1' },
      { id: 2, x: 200, y: 200, width: 100, height: 50, color: '#ef4444', text: 'Node 2' },
      { id: 3, x: 300, y: 300, width: 100, height: 50, color: '#10b981', text: 'Node 3' }
    ]

    it('should draw all nodes', () => {
      service.drawNodes(nodes)

      expect(mockCtx.roundRect).toHaveBeenCalledTimes(3)
    })

    it('should highlight selected node with different line width', () => {
      const lineWidths = []
      Object.defineProperty(mockCtx, 'lineWidth', {
        set: function(value) {
          lineWidths.push(value)
          this._lineWidth = value
        },
        get: function() {
          return this._lineWidth || 1
        },
        configurable: true
      })

      service.drawNodes(nodes, 1)

      // Should have a line width of 4 for selected node
      expect(lineWidths).toContain(4)
    })

    it('should highlight hovered node with shadow', () => {
      let shadowWasSet = false
      Object.defineProperty(mockCtx, 'shadowBlur', {
        set: function(value) {
          if (value > 0) shadowWasSet = true
          this._shadowBlur = value
        },
        get: function() {
          return this._shadowBlur || 0
        },
        configurable: true
      })

      service.drawNodes(nodes, null, 2)

      expect(shadowWasSet).toBe(true)
    })

    it('should highlight multiple selected nodes with line width 3', () => {
      const lineWidths = []
      Object.defineProperty(mockCtx, 'lineWidth', {
        set: function(value) {
          lineWidths.push(value)
          this._lineWidth = value
        },
        get: function() {
          return this._lineWidth || 1
        },
        configurable: true
      })

      service.drawNodes(nodes, null, null, [1, 2])

      // Should have a line width of 3 for multi-selected nodes
      expect(lineWidths).toContain(3)
    })

    it('should handle empty nodes array', () => {
      service.drawNodes([])

      expect(mockCtx.roundRect).not.toHaveBeenCalled()
    })
  })

  describe('drawSelectionBox', () => {
    it('should draw selection box with correct dimensions', () => {
      const selectionBox = {
        startX: 100,
        startY: 100,
        endX: 300,
        endY: 250
      }

      service.drawSelectionBox(selectionBox)

      expect(mockCtx.fillRect).toHaveBeenCalledWith(100, 100, 200, 150)
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(100, 100, 200, 150)
    })

    it('should handle inverted selection (bottom-right to top-left)', () => {
      const selectionBox = {
        startX: 300,
        startY: 250,
        endX: 100,
        endY: 100
      }

      service.drawSelectionBox(selectionBox)

      expect(mockCtx.fillRect).toHaveBeenCalledWith(100, 100, 200, 150)
    })

    it('should use dashed line for border', () => {
      const selectionBox = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200
      }

      service.drawSelectionBox(selectionBox)

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5])
      expect(mockCtx.setLineDash).toHaveBeenCalledWith([]) // Reset
    })

    it('should use semi-transparent fill', () => {
      const selectionBox = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200
      }

      service.drawSelectionBox(selectionBox)

      expect(mockCtx.fillStyle).toContain('rgba')
    })
  })

  describe('applyPanOffset', () => {
    it('should save canvas state and apply translation', () => {
      const panOffset = { x: 50, y: 30 }

      service.applyPanOffset(panOffset)

      expect(mockCtx.save).toHaveBeenCalled()
      expect(mockCtx.translate).toHaveBeenCalledWith(50, 30)
    })

    it('should handle negative offsets', () => {
      const panOffset = { x: -100, y: -50 }

      service.applyPanOffset(panOffset)

      expect(mockCtx.translate).toHaveBeenCalledWith(-100, -50)
    })

    it('should handle zero offset', () => {
      const panOffset = { x: 0, y: 0 }

      service.applyPanOffset(panOffset)

      expect(mockCtx.translate).toHaveBeenCalledWith(0, 0)
    })
  })

  describe('restoreCanvas', () => {
    it('should restore canvas state', () => {
      service.restoreCanvas()

      expect(mockCtx.restore).toHaveBeenCalled()
    })

    it('should balance save and restore calls', () => {
      service.applyPanOffset({ x: 10, y: 10 })
      service.restoreCanvas()

      expect(mockCtx.save).toHaveBeenCalledTimes(1)
      expect(mockCtx.restore).toHaveBeenCalledTimes(1)
    })
  })
})
