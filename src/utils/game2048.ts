// 2048 game utilities
import { getTileColor as getThemeColor, getTileTextColor as getThemeTextColor } from './themes2048'

export type Grid2048 = (number | null)[][]

export function createEmptyGrid(): Grid2048 {
  return Array.from({ length: 4 }, () => Array(4).fill(null))
}

export function addRandomTile(grid: Grid2048): Grid2048 {
  const newGrid = grid.map(r => [...r])
  const empty: [number, number][] = []
  
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (newGrid[r][c] === null) empty.push([r, c])
    }
  }
  
  if (empty.length === 0) return newGrid
  
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4
  
  return newGrid
}

export function initGame(): Grid2048 {
  let grid = createEmptyGrid()
  grid = addRandomTile(grid)
  grid = addRandomTile(grid)
  return grid
}

function slideRow(row: (number | null)[]): { row: (number | null)[]; score: number } {
  // Remove nulls
  const tiles = row.filter(x => x !== null) as number[]
  const result: (number | null)[] = []
  let score = 0
  let i = 0
  
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2
      result.push(merged)
      score += merged
      i += 2
    } else {
      result.push(tiles[i])
      i++
    }
  }
  
  while (result.length < 4) result.push(null)
  
  return { row: result, score }
}

export function move(grid: Grid2048, direction: 'up' | 'down' | 'left' | 'right'): { grid: Grid2048; score: number; moved: boolean } {
  let newGrid: Grid2048
  let totalScore = 0
  
  if (direction === 'left') {
    newGrid = grid.map(row => {
      const { row: newRow, score } = slideRow(row)
      totalScore += score
      return newRow
    })
  } else if (direction === 'right') {
    newGrid = grid.map(row => {
      const reversed = [...row].reverse()
      const { row: slid, score } = slideRow(reversed)
      totalScore += score
      return slid.reverse()
    })
  } else if (direction === 'up') {
    newGrid = grid.map(r => [...r])
    for (let c = 0; c < 4; c++) {
      const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]]
      const { row: newCol, score } = slideRow(col)
      totalScore += score
      for (let r = 0; r < 4; r++) newGrid[r][c] = newCol[r]
    }
  } else {
    newGrid = grid.map(r => [...r])
    for (let c = 0; c < 4; c++) {
      const col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]]
      const { row: newCol, score } = slideRow(col)
      totalScore += score
      for (let r = 0; r < 4; r++) newGrid[3 - r][c] = newCol[r]
    }
  }
  
  // Check if anything moved
  let moved = false
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] !== newGrid[r][c]) {
        moved = true
        break
      }
    }
    if (moved) break
  }
  
  return { grid: newGrid, score: totalScore, moved }
}

export function canMove(grid: Grid2048): boolean {
  // Check for empty cells
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === null) return true
    }
  }
  
  // Check for possible merges
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c]
      if (c + 1 < 4 && grid[r][c + 1] === val) return true
      if (r + 1 < 4 && grid[r + 1][c] === val) return true
    }
  }
  
  return false
}

export function hasWon(grid: Grid2048): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 2048) return true
    }
  }
  return false
}

export function getTileColor(value: number, theme: string = 'classic'): string {
  return getThemeColor(value, theme)
}

export function getTileTextColor(value: number, theme: string = 'classic'): string {
  return getThemeTextColor(value, theme)
}

/**
 * Expectimax AI with depth-2 lookahead to calculate best move
 */
export interface HintResult {
  direction: 'up' | 'down' | 'left' | 'right'
  score: number
  reason: string
}

// Heuristic evaluation function
function evaluateGrid(grid: Grid2048): number {
  let score = 0
  let emptyCells = 0
  let maxTile = 0
  
  // Count empty cells
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === null) {
        emptyCells++
      } else {
        maxTile = Math.max(maxTile, grid[r][c]!)
      }
    }
  }
  
  // Reward empty cells
  score += emptyCells * 100
  
  // Reward max tile in corner (prefer top-left)
  if (grid[0][0] === maxTile) score += 2000
  else if (grid[0][3] === maxTile || grid[3][0] === maxTile || grid[3][3] === maxTile) score += 1000
  
  // Reward monotonicity (decreasing values from corner)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] !== null && grid[r][c + 1] !== null) {
        if (grid[r][c]! >= grid[r][c + 1]!) score += 10
      }
    }
  }
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 3; r++) {
      if (grid[r][c] !== null && grid[r + 1][c] !== null) {
        if (grid[r][c]! >= grid[r + 1][c]!) score += 10
      }
    }
  }
  
  // Reward adjacent similar tiles
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] !== null && grid[r][c] === grid[r][c + 1]) {
        score += grid[r][c]! * 2
      }
    }
  }
  
  return score
}

// Expectimax with depth-2 lookahead
function expectimax(grid: Grid2048, depth: number, isMaxNode: boolean): number {
  if (depth === 0) {
    return evaluateGrid(grid)
  }
  
  if (isMaxNode) {
    // Player move - try all directions
    let maxScore = -Infinity
    const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right']
    
    for (const dir of directions) {
      const { grid: newGrid, moved } = move(grid, dir)
      if (moved) {
        const score = expectimax(newGrid, depth - 1, false)
        maxScore = Math.max(maxScore, score)
      }
    }
    
    return maxScore === -Infinity ? evaluateGrid(grid) : maxScore
  } else {
    // Random tile placement - average over possible positions
    const emptyCells: [number, number][] = []
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === null) emptyCells.push([r, c])
      }
    }
    
    if (emptyCells.length === 0) return evaluateGrid(grid)
    
    let totalScore = 0
    for (const [r, c] of emptyCells) {
      // Try placing 2 (90% probability)
      const newGrid2 = grid.map(row => [...row])
      newGrid2[r][c] = 2
      totalScore += 0.9 * expectimax(newGrid2, depth - 1, true)
      
      // Try placing 4 (10% probability)
      const newGrid4 = grid.map(row => [...row])
      newGrid4[r][c] = 4
      totalScore += 0.1 * expectimax(newGrid4, depth - 1, true)
    }
    
    return totalScore / emptyCells.length
  }
}

export function calculateBestMove(grid: Grid2048): HintResult | null {
  const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right']
  let bestDirection: 'up' | 'down' | 'left' | 'right' | null = null
  let bestScore = -Infinity
  const moveDetails: Record<string, { score: number; emptyCells: number; merges: number }> = {}
  
  for (const dir of directions) {
    const { grid: newGrid, moved, score: moveScore } = move(grid, dir)
    if (!moved) continue
    
    // Count empty cells and potential merges
    let emptyCells = 0
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (newGrid[r][c] === null) emptyCells++
      }
    }
    
    const aiScore = expectimax(newGrid, 2, false)
    moveDetails[dir] = { score: aiScore, emptyCells, merges: moveScore / 2 }
    
    if (aiScore > bestScore) {
      bestScore = aiScore
      bestDirection = dir
    }
  }
  
  if (!bestDirection) return null
  
  // Generate reason
  const details = moveDetails[bestDirection]
  const reasons: string[] = []
  
  if (details.merges > 0) {
    reasons.push(`${details.merges} merge${details.merges > 1 ? 's' : ''}`)
  }
  if (details.emptyCells > 0) {
    reasons.push(`opens ${details.emptyCells} cell${details.emptyCells > 1 ? 's' : ''}`)
  }
  
  // Check if max tile stays in corner
  const maxTile = Math.max(...grid.flat().filter(v => v !== null) as number[])
  const { grid: afterMove } = move(grid, bestDirection)
  if (afterMove[0][0] === maxTile || afterMove[0][3] === maxTile || 
      afterMove[3][0] === maxTile || afterMove[3][3] === maxTile) {
    reasons.push('keeps max tile in corner')
  }
  
  return {
    direction: bestDirection,
    score: bestScore,
    reason: reasons.length > 0 ? reasons.join(', ') : 'best strategic position'
  }
}
