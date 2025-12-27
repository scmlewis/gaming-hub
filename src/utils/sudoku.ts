// Minimal Sudoku utilities: placeholders for generator and solver

export type Grid = (number | null)[][]

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.slice())
}

function sizeInfoFromGrid(grid: Grid) {
  const n = grid.length
  let blockRows = 3
  let blockCols = 3
  if (n === 6) { blockRows = 2; blockCols = 3 }
  else if (n === 9) { blockRows = 3; blockCols = 3 }
  else {
    const r = Math.floor(Math.sqrt(n))
    if (r * r === n) { blockRows = r; blockCols = r }
    else { blockRows = Math.floor(Math.sqrt(n)); blockCols = n / blockRows }
  }
  return { n, blockRows, blockCols }
}

/**
 * Checks if placing a value at the given position is valid according to Sudoku rules.
 * Validates that the value doesn't conflict with existing values in the same row, column, or block.
 *
 * @param grid - The Sudoku grid to validate against
 * @param row - The row index (0-based)
 * @param col - The column index (0-based)
 * @param value - The value to check (1 to grid size)
 * @returns True if the move is valid, false otherwise
 */
export function isValidMove(grid: Grid, row: number, col: number, value: number): boolean {
  const { n, blockRows, blockCols } = sizeInfoFromGrid(grid)
  if (value < 1 || value > n) return false
  for (let c = 0; c < n; c++) if (grid[row][c] === value) return false
  for (let r = 0; r < n; r++) if (grid[r][col] === value) return false
  const br = Math.floor(row / blockRows) * blockRows
  const bc = Math.floor(col / blockCols) * blockCols
  for (let r = br; r < br + blockRows; r++) for (let c = bc; c < bc + blockCols; c++) if (grid[r][c] === value) return false
  return true
}

function findEmpty(grid: Grid): [number, number] | null {
  const n = grid.length
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!grid[r][c]) return [r, c]
  return null
}

/**
 * Solves a Sudoku puzzle using backtracking algorithm.
 *
 * @param grid - The Sudoku puzzle grid to solve
 * @returns The solved grid, or null if no solution exists
 */
export function solveSudoku(grid: Grid): Grid | null {
  const g = cloneGrid(grid)
  const n = g.length

  function backtrack(): boolean {
    const empty = findEmpty(g)
    if (!empty) return true
    const [r, c] = empty
    for (let num = 1; num <= n; num++) {
      if (isValidMove(g, r, c, num)) {
        g[r][c] = num
        if (backtrack()) return true
        g[r][c] = null
      }
    }
    return false
  }

  return backtrack() ? g : null
}

// Count solutions but stop after reaching limit (default 2)
function countSolutions(grid: Grid, limit = 2): number {
  const g = cloneGrid(grid)
  const n = g.length
  let count = 0

  function backtrack(): boolean {
    if (count >= limit) return true
    const empty = findEmpty(g)
    if (!empty) {
      count++
      return false
    }
    const [r, c] = empty
    for (let num = 1; num <= n; num++) {
      if (isValidMove(g, r, c, num)) {
        g[r][c] = num
        backtrack()
        g[r][c] = null
        if (count >= limit) return true
      }
    }
    return false
  }

  backtrack()
  return count
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateFullSolution(n = 9, blockRows?: number, blockCols?: number): Grid {
  const grid: Grid = Array.from({ length: n }, () => Array(n).fill(null))
  const br = blockRows ?? (n === 6 ? 2 : Math.floor(Math.sqrt(n)))
  const bc = blockCols ?? (n === 6 ? 3 : Math.floor(Math.sqrt(n)))

  function backtrack(): boolean {
    const empty = findEmpty(grid)
    if (!empty) return true
    const [r, c] = empty
    const nums = shuffle(Array.from({ length: n }, (_, i) => i + 1))
    for (const num of nums) {
      if (isValidMove(grid, r, c, num)) {
        grid[r][c] = num
        if (backtrack()) return true
        grid[r][c] = null
      }
    }
    return false
  }

  backtrack()
  return grid
}

import { CLUES_BY_DIFFICULTY_9X9 } from '../constants'

/**
 * Generates a Sudoku puzzle of the specified difficulty and size.
 * The puzzle is guaranteed to have a unique solution.
 *
 * @param difficulty - The difficulty level ('easy', 'medium', or 'hard')
 * @param size - The grid size (6 or 9)
 * @returns A 2D array representing the puzzle grid (null for empty cells)
 */
export function generateSudoku(difficulty: 'easy' | 'medium' | 'hard' = 'easy', size = 9): Grid {
  // Generate a complete solution then remove numbers while keeping uniqueness
  const blockRows = size === 6 ? 2 : Math.floor(Math.sqrt(size))
  const blockCols = size === 6 ? 3 : Math.floor(Math.sqrt(size))
  const solution = generateFullSolution(size, blockRows, blockCols)
  const puzzle = cloneGrid(solution)

  // scale targets for different sizes (heuristic)
  const total = size * size
  const baseTarget =
    size === 9
      ? CLUES_BY_DIFFICULTY_9X9[difficulty] ?? CLUES_BY_DIFFICULTY_9X9.easy
      : Math.max(Math.floor(total * 0.5), 6)

  const targetClues = baseTarget
  const positions = shuffle(
    Array.from({ length: total }, (_, i) => [Math.floor(i / size), i % size] as [number, number])
  )

  let clues = total
  for (const [r, c] of positions) {
    if (clues <= targetClues) break
    const backup = puzzle[r][c]
    puzzle[r][c] = null
    // ensure unique solution
    const sols = countSolutions(puzzle, 2)
    if (sols !== 1) {
      puzzle[r][c] = backup
    } else {
      clues--
    }
  }

  return puzzle
}
