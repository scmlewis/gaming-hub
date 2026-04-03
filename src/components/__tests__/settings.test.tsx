import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import SudokuPage from '../../pages/SudokuPage'

// Helper to render with router context
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Settings persistence on Sudoku page', () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation(() => 0 as any)
    clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {})
    localStorage.clear()
    document.documentElement.removeAttribute('data-accent')
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })

  test('selecting an accent updates localStorage and document attribute', async () => {
    renderWithRouter(<SudokuPage />)
    const user = userEvent.setup()
    // Open Settings modal first
    const settingsBtn = await screen.findByRole('button', { name: /settings/i })
    await act(async () => {
      await user.click(settingsBtn)
    })
    // Click the Teal button in the Settings modal
    const teal = await screen.findByRole('button', { name: /teal/i })
    await act(async () => {
      await user.click(teal)
    })
    // Expect the value persisted
    expect(localStorage.getItem('accent')).toBe('teal')
    // Document attribute should be set
    expect(document.documentElement.getAttribute('data-accent')).toBe('teal')
  })

  test('settings buttons in modal are keyboard accessible', async () => {
    renderWithRouter(<SudokuPage />)
    const user = userEvent.setup()
    // Open Settings modal first
    const settingsBtn = await screen.findByRole('button', { name: /settings/i })
    await act(async () => {
      await user.click(settingsBtn)
    })
    // find Blue button and focus it
    const blue = await screen.findByRole('button', { name: /blue/i })
    blue.focus()
    expect(document.activeElement).toBe(blue)
  })
})
