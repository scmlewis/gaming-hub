import { describe, it, expect } from 'vitest'
import { generateSudoku, solveSudoku, isValidMove } from '../sudoku'

describe('sudoku utils', () => {
  it('generateSudoku returns correct size and solvable (9x9)', () => {
    const { puzzle } = generateSudoku('easy', 9)
    expect(puzzle.length).toBe(9)
    expect(puzzle.every(r => r.length === 9)).toBe(true)
    const sol = solveSudoku(puzzle)
    expect(sol).not.toBeNull()
    expect(sol!.every(row => row.every(v => typeof v === 'number' && v >= 1 && v <= 9))).toBe(true)
  })

  it('isValidMove enforces row/col/block rules', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(null)) as any
    grid[0][0] = 5
    expect(isValidMove(grid, 0, 1, 5)).toBe(false) // same row
    expect(isValidMove(grid, 1, 0, 5)).toBe(false) // same col
    expect(isValidMove(grid, 1, 1, 5)).toBe(false) // same block
    expect(isValidMove(grid, 0, 1, 3)).toBe(true)
  })

  it('generateSudoku supports 6x6', () => {
    const { puzzle: p6 } = generateSudoku('easy', 6)
    expect(p6.length).toBe(6)
    expect(p6.every(r => r.length === 6)).toBe(true)
    const s6 = solveSudoku(p6)
    expect(s6).not.toBeNull()
  })
})
