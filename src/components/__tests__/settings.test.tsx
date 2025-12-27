import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import SudokuPage from '../../pages/SudokuPage'

// Helper to render with router context
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Settings persistence on Sudoku page', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-accent')
    document.documentElement.removeAttribute('data-theme')
  })

  test('selecting an accent updates localStorage and document attribute', async () => {
    renderWithRouter(<SudokuPage />)
    const user = userEvent.setup()
    // Open Settings modal first
    const settingsBtn = await screen.findByRole('button', { name: /settings/i })
    await user.click(settingsBtn)
    // Click the Teal button in the Settings modal
    const teal = await screen.findByRole('button', { name: /teal/i })
    await user.click(teal)
    // Expect the value persisted
    expect(localStorage.getItem('accent')).toBe('teal')
    // Document attribute should be set
    expect(document.documentElement.getAttribute('data-accent')).toBe('teal')
  })

  test('theme buttons in settings modal are keyboard accessible', async () => {
    renderWithRouter(<SudokuPage />)
    const user = userEvent.setup()
    // Open Settings modal first
    const settingsBtn = await screen.findByRole('button', { name: /settings/i })
    await user.click(settingsBtn)
    // find Dark button and focus it
    const dark = await screen.findByRole('button', { name: /dark/i })
    dark.focus()
    expect(document.activeElement).toBe(dark)
  })
})
