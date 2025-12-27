// 2048 game utilities

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

export function getTileColor(value: number): string {
  const colors: Record<number, string> = {
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e'
  }
  return colors[value] || '#3c3a32'
}

export function getTileTextColor(value: number): string {
  return value <= 4 ? '#776e65' : '#f9f6f2'
}
