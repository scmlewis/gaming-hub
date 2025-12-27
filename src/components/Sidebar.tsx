import React from 'react'

type Props = {
  openSettings: () => void
  compact: boolean
  onToggleCompact: () => void
}

const Sidebar: React.FC<Props> = ({ openSettings, compact, onToggleCompact }) => {
  return (
    <aside className={`sidebar ${compact ? 'compact' : ''}`} aria-label="Sidebar">
      <h3>Menu</h3>
      <div className="nav">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="label">Game</span></button>
        <button onClick={openSettings}><span className="label">Settings</span></button>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={onToggleCompact} aria-pressed={compact}>{compact ? 'Expand sidebar' : 'Compact sidebar'}</button>
      </div>
    </aside>
  )
}

export default Sidebar
