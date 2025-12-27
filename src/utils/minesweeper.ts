// Minesweeper game utilities

export type CellState = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

export type MineGrid = CellState[][]

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
}

export function createGrid(rows: number, cols: number, mines: number, firstClick?: [number, number]): MineGrid {
  const grid: MineGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0
    }))
  )

  // Place mines randomly, avoiding firstClick cell and its neighbors
  const avoid = new Set<string>()
  if (firstClick) {
    const [fr, fc] = firstClick
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        avoid.add(`${fr + dr}-${fc + dc}`)
      }
    }
  }

  let placed = 0
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (!grid[r][c].isMine && !avoid.has(`${r}-${c}`)) {
      grid[r][c].isMine = true
      placed++
    }
  }

  // Calculate adjacent mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].isMine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine) {
            count++
          }
        }
      }
      grid[r][c].adjacentMines = count
    }
  }

  return grid
}

export function revealCell(grid: MineGrid, row: number, col: number): MineGrid {
  const rows = grid.length
  const cols = grid[0].length
  const newGrid = grid.map(r => r.map(c => ({ ...c })))

  function flood(r: number, c: number) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return
    if (newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) return
    
    newGrid[r][c].isRevealed = true
    
    if (newGrid[r][c].adjacentMines === 0 && !newGrid[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) flood(r + dr, c + dc)
        }
      }
    }
  }

  flood(row, col)
  return newGrid
}

export function toggleFlag(grid: MineGrid, row: number, col: number): MineGrid {
  if (grid[row][col].isRevealed) return grid
  const newGrid = grid.map(r => r.map(c => ({ ...c })))
  newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged
  return newGrid
}

export function checkWin(grid: MineGrid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) return false
    }
  }
  return true
}

export function checkLose(grid: MineGrid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isMine && cell.isRevealed) return true
    }
  }
  return false
}

export function revealAllMines(grid: MineGrid): MineGrid {
  return grid.map(r => r.map(c => ({
    ...c,
    isRevealed: c.isMine ? true : c.isRevealed
  })))
}

export function countFlags(grid: MineGrid): number {
  let count = 0
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isFlagged) count++
    }
  }
  return count
}
