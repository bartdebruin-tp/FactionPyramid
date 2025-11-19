import { describe, it, expect, beforeEach } from 'vitest'
import { LayoutService } from '@/services/layoutService.js'

describe('LayoutService', () => {
  let service

  beforeEach(() => {
    const canvasSize = { width: 1920, height: 1080 }
    service = new LayoutService(canvasSize)
  })

  describe('constructor', () => {
    it('should initialize with canvas size', () => {
      expect(service.canvasSize).toEqual({ width: 1920, height: 1080 })
    })

    it('should set default layout gaps', () => {
      expect(service.levelGap).toBe(150)
      expect(service.nodeGap).toBe(180)
    })
  })

  describe('findRootNodes', () => {
    it('should identify root nodes with no parents', () => {
      const nodes = [
        { id: 1, text: 'Root' },
        { id: 2, text: 'Child 1' },
        { id: 3, text: 'Child 2' }
      ]
      const connections = [
        { from: 1, to: 2 },
        { from: 1, to: 3 }
      ]

      const roots = service.findRootNodes(nodes, connections)

      expect(roots).toHaveLength(1)
      expect(roots[0].id).toBe(1)
    })

    it('should handle multiple root nodes', () => {
      const nodes = [
        { id: 1, text: 'Root 1' },
        { id: 2, text: 'Root 2' },
        { id: 3, text: 'Child' }
      ]
      const connections = [
        { from: 1, to: 3 }
      ]

      const roots = service.findRootNodes(nodes, connections)

      expect(roots).toHaveLength(2)
      expect(roots.map(r => r.id)).toContain(1)
      expect(roots.map(r => r.id)).toContain(2)
    })

    it('should return first node if no connections exist', () => {
      const nodes = [
        { id: 1, text: 'Only Node' }
      ]
      const connections = []

      const roots = service.findRootNodes(nodes, connections)

      expect(roots).toHaveLength(1)
      expect(roots[0].id).toBe(1)
    })

    it('should handle empty nodes array', () => {
      const roots = service.findRootNodes([], [])

      expect(roots).toHaveLength(0)
    })

    it('should identify all nodes as roots when no connections', () => {
      const nodes = [
        { id: 1, text: 'Node 1' },
        { id: 2, text: 'Node 2' },
        { id: 3, text: 'Node 3' }
      ]

      const roots = service.findRootNodes(nodes, [])

      expect(roots).toHaveLength(3)
    })
  })

  describe('buildNodeMaps', () => {
    it('should create node map from nodes', () => {
      const nodes = [
        { id: 1, text: 'Node 1' },
        { id: 2, text: 'Node 2' }
      ]
      const connections = []

      const { nodeMap } = service.buildNodeMaps(nodes, connections)

      expect(nodeMap.size).toBe(2)
      expect(nodeMap.get(1)).toBeDefined()
      expect(nodeMap.get(2)).toBeDefined()
    })

    it('should create children map from connections', () => {
      const nodes = [
        { id: 1, text: 'Parent' },
        { id: 2, text: 'Child 1' },
        { id: 3, text: 'Child 2' }
      ]
      const connections = [
        { from: 1, to: 2 },
        { from: 1, to: 3 }
      ]

      const { childrenMap } = service.buildNodeMaps(nodes, connections)

      expect(childrenMap.get(1)).toEqual([2, 3])
      expect(childrenMap.get(2)).toEqual([])
      expect(childrenMap.get(3)).toEqual([])
    })

    it('should handle nodes with no children', () => {
      const nodes = [
        { id: 1, text: 'Leaf Node' }
      ]
      const connections = []

      const { childrenMap } = service.buildNodeMaps(nodes, connections)

      expect(childrenMap.get(1)).toEqual([])
    })

    it('should handle complex hierarchies', () => {
      const nodes = [
        { id: 1, text: 'Root' },
        { id: 2, text: 'Branch 1' },
        { id: 3, text: 'Branch 2' },
        { id: 4, text: 'Leaf 1' },
        { id: 5, text: 'Leaf 2' }
      ]
      const connections = [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 2, to: 5 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)

      expect(nodeMap.size).toBe(5)
      expect(childrenMap.get(1)).toEqual([2, 3])
      expect(childrenMap.get(2)).toEqual([4, 5])
    })
  })

  describe('buildLevelStructure', () => {
    it('should create levels using BFS', () => {
      const childrenMap = new Map([
        [1, [2, 3]],
        [2, [4]],
        [3, []],
        [4, []]
      ])

      const levels = service.buildLevelStructure(1, childrenMap)

      expect(levels).toHaveLength(3)
      expect(levels[0]).toEqual([1])
      expect(levels[1]).toContain(2)
      expect(levels[1]).toContain(3)
      expect(levels[2]).toEqual([4])
    })

    it('should handle single node', () => {
      const childrenMap = new Map([
        [1, []]
      ])

      const levels = service.buildLevelStructure(1, childrenMap)

      expect(levels).toHaveLength(1)
      expect(levels[0]).toEqual([1])
    })

    it('should handle deep hierarchies', () => {
      const childrenMap = new Map([
        [1, [2]],
        [2, [3]],
        [3, [4]],
        [4, [5]],
        [5, []]
      ])

      const levels = service.buildLevelStructure(1, childrenMap)

      expect(levels).toHaveLength(5)
      levels.forEach((level, index) => {
        expect(level).toHaveLength(1)
        expect(level[0]).toBe(index + 1)
      })
    })

    it('should handle wide hierarchies', () => {
      const childrenMap = new Map([
        [1, [2, 3, 4, 5]],
        [2, []],
        [3, []],
        [4, []],
        [5, []]
      ])

      const levels = service.buildLevelStructure(1, childrenMap)

      expect(levels).toHaveLength(2)
      expect(levels[0]).toEqual([1])
      expect(levels[1]).toHaveLength(4)
    })

    it('should prevent infinite loops with visited tracking', () => {
      const childrenMap = new Map([
        [1, [2]],
        [2, []]
      ])

      const levels = service.buildLevelStructure(1, childrenMap)

      expect(levels).toBeDefined()
      expect(levels.length).toBeGreaterThan(0)
    })
  })

  describe('calculateTreePositions', () => {
    it('should calculate positions for single level', () => {
      const levels = [[1]]
      const positions = service.calculateTreePositions(levels, 100, 100, 400)

      expect(positions.get(1)).toBeDefined()
      expect(positions.get(1).y).toBe(100)
    })

    it('should space nodes horizontally within a level', () => {
      const levels = [[1, 2, 3]]
      const positions = service.calculateTreePositions(levels, 100, 100, 600)

      const pos1 = positions.get(1)
      const pos2 = positions.get(2)
      const pos3 = positions.get(3)

      expect(pos1.x).toBeLessThan(pos2.x)
      expect(pos2.x).toBeLessThan(pos3.x)
      expect(pos1.y).toBe(pos2.y)
      expect(pos2.y).toBe(pos3.y)
    })

    it('should space levels vertically', () => {
      const levels = [[1], [2], [3]]
      const positions = service.calculateTreePositions(levels, 100, 100, 400)

      const pos1 = positions.get(1)
      const pos2 = positions.get(2)
      const pos3 = positions.get(3)

      expect(pos1.y).toBeLessThan(pos2.y)
      expect(pos2.y).toBeLessThan(pos3.y)
      expect(pos2.y - pos1.y).toBe(service.levelGap)
    })

    it('should center nodes within tree width', () => {
      const levels = [[1], [2, 3]]
      const treeWidth = 400
      const positions = service.calculateTreePositions(levels, 100, 100, treeWidth)

      const pos1 = positions.get(1)
      // Root should be centered
      expect(pos1.x).toBeGreaterThan(100)
    })

    it('should handle empty levels array', () => {
      const positions = service.calculateTreePositions([], 100, 100, 400)

      expect(positions.size).toBe(0)
    })
  })

  describe('calculateHierarchicalLayout', () => {
    it('should calculate positions for simple hierarchy', () => {
      const nodes = [
        { id: 1, text: 'Root' },
        { id: 2, text: 'Child' }
      ]
      const connections = [
        { from: 1, to: 2 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)
      const rootNodes = service.findRootNodes(nodes, connections)
      const positions = service.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)

      expect(positions.size).toBe(2)
      expect(positions.get(1)).toBeDefined()
      expect(positions.get(2)).toBeDefined()
    })

    it('should position child below parent', () => {
      const nodes = [
        { id: 1, text: 'Parent' },
        { id: 2, text: 'Child' }
      ]
      const connections = [
        { from: 1, to: 2 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)
      const rootNodes = service.findRootNodes(nodes, connections)
      const positions = service.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)

      expect(positions.get(2).y).toBeGreaterThan(positions.get(1).y)
    })

    it('should handle multiple root trees', () => {
      const nodes = [
        { id: 1, text: 'Root 1' },
        { id: 2, text: 'Root 2' },
        { id: 3, text: 'Child 1' },
        { id: 4, text: 'Child 2' }
      ]
      const connections = [
        { from: 1, to: 3 },
        { from: 2, to: 4 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)
      const rootNodes = service.findRootNodes(nodes, connections)
      const positions = service.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)

      expect(positions.size).toBe(4)
      // Root nodes should be spaced horizontally
      expect(positions.get(1).x).not.toBe(positions.get(2).x)
    })

    it('should center layout on canvas', () => {
      const nodes = [
        { id: 1, text: 'Root' },
        { id: 2, text: 'Child' }
      ]
      const connections = [
        { from: 1, to: 2 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)
      const rootNodes = service.findRootNodes(nodes, connections)
      const positions = service.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)

      // Root should be somewhere near the center
      const rootPos = positions.get(1)
      expect(rootPos.x).toBeGreaterThan(0)
      expect(rootPos.x).toBeLessThan(service.canvasSize.width)
    })

    it('should handle complex multi-level hierarchy', () => {
      const nodes = [
        { id: 1, text: 'Root' },
        { id: 2, text: 'Branch 1' },
        { id: 3, text: 'Branch 2' },
        { id: 4, text: 'Leaf 1' },
        { id: 5, text: 'Leaf 2' },
        { id: 6, text: 'Leaf 3' }
      ]
      const connections = [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 2, to: 5 },
        { from: 3, to: 6 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)
      const rootNodes = service.findRootNodes(nodes, connections)
      const positions = service.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)

      expect(positions.size).toBe(6)
      
      // Verify vertical ordering
      expect(positions.get(2).y).toBeGreaterThan(positions.get(1).y)
      expect(positions.get(4).y).toBeGreaterThan(positions.get(2).y)
      
      // Siblings should be at same level
      expect(positions.get(2).y).toBe(positions.get(3).y)
    })

    it('should handle empty hierarchy', () => {
      const positions = service.calculateHierarchicalLayout([], new Map(), new Map())

      expect(positions.size).toBe(0)
    })
  })

  describe('updateCanvasSize', () => {
    it('should update canvas dimensions', () => {
      service.updateCanvasSize(800, 600)

      expect(service.canvasSize.width).toBe(800)
      expect(service.canvasSize.height).toBe(600)
    })

    it('should allow setting very large canvas size', () => {
      service.updateCanvasSize(4000, 3000)

      expect(service.canvasSize.width).toBe(4000)
      expect(service.canvasSize.height).toBe(3000)
    })

    it('should allow setting very small canvas size', () => {
      service.updateCanvasSize(100, 100)

      expect(service.canvasSize.width).toBe(100)
      expect(service.canvasSize.height).toBe(100)
    })
  })

  describe('integration tests', () => {
    it('should layout a complete organizational structure', () => {
      const nodes = [
        { id: 1, text: 'CEO' },
        { id: 2, text: 'CTO' },
        { id: 3, text: 'CFO' },
        { id: 4, text: 'Dev Lead' },
        { id: 5, text: 'Developer 1' },
        { id: 6, text: 'Developer 2' }
      ]
      const connections = [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 4, to: 5 },
        { from: 4, to: 6 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)
      const rootNodes = service.findRootNodes(nodes, connections)
      const positions = service.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)

      // All nodes should have positions
      expect(positions.size).toBe(6)
      
      // CEO at top
      const ceoY = positions.get(1).y
      expect(ceoY).toBe(100)
      
      // CTO and CFO below CEO at same level
      expect(positions.get(2).y).toBeGreaterThan(ceoY)
      expect(positions.get(2).y).toBe(positions.get(3).y)
      
      // Devs at bottom level
      expect(positions.get(5).y).toBeGreaterThan(positions.get(4).y)
      expect(positions.get(5).y).toBe(positions.get(6).y)
    })

    it('should handle forest structure with multiple trees', () => {
      const nodes = [
        { id: 1, text: 'Tree 1 Root' },
        { id: 2, text: 'Tree 1 Child' },
        { id: 3, text: 'Tree 2 Root' },
        { id: 4, text: 'Tree 2 Child' },
        { id: 5, text: 'Isolated Node' }
      ]
      const connections = [
        { from: 1, to: 2 },
        { from: 3, to: 4 }
      ]

      const { nodeMap, childrenMap } = service.buildNodeMaps(nodes, connections)
      const rootNodes = service.findRootNodes(nodes, connections)
      const positions = service.calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap)

      // All nodes should have positions
      expect(positions.size).toBe(5)
      
      // Trees should be separated horizontally
      const tree1X = positions.get(1).x
      const tree2X = positions.get(3).x
      const tree3X = positions.get(5).x
      
      expect(tree1X).not.toBe(tree2X)
      expect(tree2X).not.toBe(tree3X)
    })
  })
})
