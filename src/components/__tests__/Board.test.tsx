import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Board from '../Board'

// Mock sudoku utilities to make behavior deterministic
vi.mock('../../utils/sudoku', async () => {
  const actual = await vi.importActual('../../utils/sudoku')
  // create a simple 6x6 puzzle for tests
  const puzzle6 = [
    [1, null, null, 4, null, null],
    [null, 2, null, null, 5, null],
    [null, null, 3, null, null, 6],
    [4, null, null, 1, null, null],
    [null, 5, null, null, 2, null],
    [null, null, 6, null, null, 3]
  ]
  const solution6 = [
    [1,6,5,4,3,2],
    [3,2,4,6,5,1],
    [2,4,3,5,1,6],
    [4,3,2,1,6,5],
    [6,5,1,3,2,4],
    [5,1,6,2,4,3]
  ]
  return {
    ...(actual as any),
    generateSudoku: vi.fn(() => puzzle6),
    solveSudoku: vi.fn(() => solution6),
    isValidMove: vi.fn((grid, r, c, v) => true)
  }
})

describe('Board component', () => {
  it('renders and allows entering a number via keyboard', async () => {
    render(<Board difficulty="easy" size={6} />)
    // find a non-fixed cell (0,1)
    const cellButton = screen.getByLabelText('Cell 1-2')
    expect(cellButton).toBeInTheDocument()
    // click to select
    await userEvent.click(cellButton)
    // press 7 (invalid for 6x6) -> should be ignored because size limits but our mock isValidMove returns true
    await fireEvent.keyDown(window, { key: '4' })
    // After input, the button should display '4'
    expect(cellButton).toHaveTextContent('4')
  })
})
