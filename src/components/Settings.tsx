import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  peerHighlight: boolean
  onTogglePeerHighlight: () => void
  largeFont: boolean
  onToggleLargeFont: () => void
  fixedCellStyle: 'filled' | 'outlined'
  onChangeFixedCellStyle: (style: 'filled' | 'outlined') => void
  accent: string
  onChangeAccent: (a: string) => void
}

const Settings: React.FC<Props> = ({ open, onClose, peerHighlight, onTogglePeerHighlight, largeFont, onToggleLargeFont, fixedCellStyle, onChangeFixedCellStyle, accent, onChangeAccent }) => {
  if (!open) return null

  function exportSave() {
    const raw = localStorage.getItem('sudoku-save-v1')
    if (!raw) {
      alert('No saved game found to export.')
      return
    }
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sudoku-save-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importSave(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const text = String(e.target?.result ?? '')
        // try parsing
        JSON.parse(text)
        localStorage.setItem('sudoku-save-v1', text)
        alert('Save imported. Use Load in the game controls to load it.')
      } catch (err) {
        alert('Invalid save file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Accent Section */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, opacity: 0.8 }}>Accent Color</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn-secondary ${accent === 'blue' ? 'selected' : ''}`} onClick={() => onChangeAccent('blue')}>
                <span className="theme-swatch theme-swatch-blue" aria-hidden></span>
                <span>Blue</span>
              </button>
              <button className={`btn-secondary ${accent === 'teal' ? 'selected' : ''}`} onClick={() => onChangeAccent('teal')}>
                <span className="theme-swatch theme-swatch-teal" aria-hidden></span>
                <span>Teal</span>
              </button>
              <button className={`btn-secondary ${accent === 'purple' ? 'selected' : ''}`} onClick={() => onChangeAccent('purple')}>
                <span className="theme-swatch theme-swatch-purple" aria-hidden></span>
                <span>Purple</span>
              </button>
            </div>
          </div>

          {/* Gameplay Options */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, opacity: 0.8 }}>Gameplay</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={peerHighlight} onChange={onTogglePeerHighlight} />
                <span>Enable peer-highlighting</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={largeFont} onChange={onToggleLargeFont} />
                <span>Use larger font for accessibility</span>
              </label>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="fixedCellStyle" value="outlined" checked={fixedCellStyle === 'outlined'} onChange={() => onChangeFixedCellStyle('outlined')} />
                  <span>Fixed cells: Outlined</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="fixedCellStyle" value="filled" checked={fixedCellStyle === 'filled'} onChange={() => onChangeFixedCellStyle('filled')} />
                  <span>Fixed cells: Filled</span>
                </label>
              </div>
            </div>
          </div>

          {/* Save/Load */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, opacity: 0.8 }}>Data</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-secondary" onClick={exportSave}>Export saved game</button>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="file" accept="application/json" style={{ display: 'none' }} onChange={e => importSave(e.target.files ? e.target.files[0] : null)} />
                <button className="btn-secondary" type="button" onClick={e => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}>Import saved game</button>
              </label>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6 }}>
              <p style={{ margin: 0 }}>Tip: you can export and share saved games with others.</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={(e) => { e.stopPropagation(); onClose(); }} type="button">Done</button>
        </div>
      </div>
    </div>
  )
}

export default Settings
