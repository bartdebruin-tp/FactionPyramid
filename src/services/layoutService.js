/**
 * Layout Service
 * Handles hierarchical layout calculations for the mind map
 */

export class LayoutService {
  constructor(canvasSize) {
    this.canvasSize = canvasSize
    this.levelGap = 150
    this.nodeGap = 180
  }

  /**
   * Calculate hierarchical tree layout positions for all nodes
   */
  calculateHierarchicalLayout(rootNodes, nodeMap, childrenMap) {
    const positions = new Map()
    
    // Calculate tree dimensions for each root
    const treeDimensions = rootNodes.map(rootNode => {
      const levels = this.buildLevelStructure(rootNode.id, childrenMap)
      const width = Math.max(...levels.map(level => level.length)) * this.nodeGap
      const height = levels.length * this.levelGap
      return { rootNode, levels, width, height }
    })
    
    // Calculate total width needed and spacing
    const totalTreeWidth = treeDimensions.reduce((sum, tree) => sum + tree.width, 0)
    const horizontalSpacing = 200 // Gap between trees
    const totalWidth = totalTreeWidth + (treeDimensions.length - 1) * horizontalSpacing
    
    // Start position (centered horizontally)
    let currentX = (this.canvasSize.width - totalWidth) / 2
    const startY = 100
    
    treeDimensions.forEach(({ rootNode, levels, width }) => {
      const treePositions = this.calculateTreePositions(levels, currentX, startY, width)
      
      // Merge positions
      treePositions.forEach((pos, nodeId) => {
        positions.set(nodeId, pos)
      })
      
      // Move to next tree position (horizontally)
      currentX += width + horizontalSpacing
    })

    return positions
  }

  /**
   * Build level structure using BFS (Breadth-First Search)
   */
  buildLevelStructure(rootId, childrenMap) {
    const levels = []
    const queue = [{ id: rootId, level: 0 }]
    const visited = new Set()

    while (queue.length > 0) {
      const { id, level } = queue.shift()

      if (visited.has(id)) continue
      visited.add(id)

      if (!levels[level]) {
        levels[level] = []
      }
      levels[level].push(id)

      const children = childrenMap.get(id) || []
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 })
        }
      })
    }

    return levels
  }

  /**
   * Calculate positions for each level in the tree
   */
  calculateTreePositions(levels, startX, startY, treeWidth) {
    const positions = new Map()

    levels.forEach((levelNodes, levelIndex) => {
      const y = startY + levelIndex * this.levelGap
      const levelWidth = levelNodes.length * this.nodeGap
      const levelStartX = startX + (treeWidth - levelWidth) / 2

      levelNodes.forEach((nodeId, nodeIndex) => {
        const x = levelStartX + nodeIndex * this.nodeGap + this.nodeGap / 2
        positions.set(nodeId, { x, y })
      })
    })

    return positions
  }

  /**
   * Find root nodes from connections
   */
  findRootNodes(nodes, connections) {
    const childIds = new Set(connections.map(c => c.to))
    const rootNodes = nodes.filter(n => !childIds.has(n.id))
    
    // If no root found, make first node the root
    if (rootNodes.length === 0 && nodes.length > 0) {
      return [nodes[0]]
    }
    
    return rootNodes
  }

  /**
   * Build node and children maps from nodes and connections
   */
  buildNodeMaps(nodes, connections) {
    const nodeMap = new Map()
    const childrenMap = new Map()

    // Build node relationships
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        id: node.id,
        text: node.text,
        isRoot: false,
        node: node
      })
      childrenMap.set(node.id, [])
    })

    // Determine parent-child relationships from connections
    connections.forEach(conn => {
      const children = childrenMap.get(conn.from) || []
      children.push(conn.to)
      childrenMap.set(conn.from, children)
    })

    return { nodeMap, childrenMap }
  }

  /**
   * Update canvas size
   */
  updateCanvasSize(width, height) {
    this.canvasSize.width = width
    this.canvasSize.height = height
  }
}
