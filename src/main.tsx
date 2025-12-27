import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { DevModeProvider } from './components/DevPanel'
import './index.css'

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <DevModeProvider>
      <App />
    </DevModeProvider>
  </React.StrictMode>
)

// Calculate and set --ui-vertical-space on `.app-root` based on actual DOM heights.
// This ensures `--cell-size` (which depends on --ui-vertical-space) adapts to available viewport height.
function installAdaptiveHeight() {
  // Avoid installing multiple times (React StrictMode may call twice in dev)
  if (window.__sudoku_adaptive_height_installed) return
  window.__sudoku_adaptive_height_installed = true

  const rootEl = document.querySelector('.app-root') as HTMLElement | null
  if (!rootEl) return

  const measure = () => {
    // Measure header, controls, and any top/bottom chrome inside .app-root
    const header = rootEl.querySelector('header') as HTMLElement | null
    const controls = rootEl.querySelector('.controls') as HTMLElement | null
    const boardSide = rootEl.querySelector('.board-side') as HTMLElement | null


    const headerH = header ? header.getBoundingClientRect().height : 0
    const controlsH = controls ? controls.getBoundingClientRect().height : 0

    // base padding/margins + small safety buffer
    // lowered a bit to give boards more room on short viewports
    const baseChrome = 20

    // compute vertical chrome from header + controls only (ignore side panel height)
    // this lets the board use the majority of the viewport height and avoids over-constraining
    const uiVertical = headerH + controlsH + baseChrome

    // Ensure a sensible minimum so we don't end up with negative or absurd values
    const final = Math.max(140, Math.round(uiVertical))
    rootEl.style.setProperty('--ui-vertical-space', `${final}px`)
  }

  // Use ResizeObserver where available for precise updates
  try {
    const ro = new ResizeObserver(() => {
      measure()
    })
    // observe header, controls and board-side if present
    const header = rootEl.querySelector('header')
    const controls = rootEl.querySelector('.controls')
    const boardSide = rootEl.querySelector('.board-side')
    if (header) ro.observe(header)
    if (controls) ro.observe(controls)
    if (boardSide) ro.observe(boardSide)

    // also observe root for layout changes
    ro.observe(rootEl)

    // call once to set initial value
    requestAnimationFrame(measure)
  } catch (e) {
    // fallback: window resize
    window.addEventListener('resize', () => requestAnimationFrame(measure))
    requestAnimationFrame(measure)
  }
}

// Run after a short delay to let initial render occur
setTimeout(installAdaptiveHeight, 50)
