import { test, expect } from '@playwright/test'

test('homepage loads and shows title', async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await expect(page.locator('h1')).toHaveText(/Sudoku/) 
})
