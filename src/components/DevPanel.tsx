import React, { useState, useEffect, createContext, useContext } from 'react'

const DEV_PASSWORD = '1234'
const DEV_MODE_KEY = 'gaming_hub_dev_mode'

// Context to share dev mode state
const DevModeContext = createContext<{
  isDevMode: boolean
  toggleDevMode: () => void
  logout: () => void
}>({ isDevMode: false, toggleDevMode: () => {}, logout: () => {} })

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(() => {
    return sessionStorage.getItem(DEV_MODE_KEY) === 'true'
  })
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const toggleDevMode = () => {
    if (isDevMode) {
      sessionStorage.removeItem(DEV_MODE_KEY)
      setIsDevMode(false)
    } else {
      setShowPasswordPrompt(true)
      setPassword('')
      setError('')
    }
  }

  const logout = () => {
    sessionStorage.removeItem(DEV_MODE_KEY)
    setIsDevMode(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === DEV_PASSWORD) {
      sessionStorage.setItem(DEV_MODE_KEY, 'true')
      setIsDevMode(true)
      setShowPasswordPrompt(false)
      setPassword('')
      setError('')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <DevModeContext.Provider value={{ isDevMode, toggleDevMode, logout }}>
      {children}
      
      {/* Floating dev mode toggle button */}
      <button 
        className={`dev-mode-fab ${isDevMode ? 'active' : ''}`}
        onClick={toggleDevMode}
        title={isDevMode ? 'Exit Dev Mode' : 'Enter Dev Mode'}
      >
        {isDevMode ? '🔓' : '🔒'}
      </button>

      {/* Password prompt modal */}
      {showPasswordPrompt && (
        <div className="dev-password-overlay" onClick={() => setShowPasswordPrompt(false)}>
          <form className="dev-password-modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3>🔐 Enter Dev Password</h3>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="dev-password-input"
            />
            {error && <div className="dev-password-error">{error}</div>}
            <div className="dev-password-actions">
              <button type="button" onClick={() => setShowPasswordPrompt(false)} className="dev-btn">
                Cancel
              </button>
              <button type="submit" className="dev-btn dev-btn-success">
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}
    </DevModeContext.Provider>
  )
}

export function useDevMode() {
  return useContext(DevModeContext).isDevMode
}

export function useDevModeControls() {
  return useContext(DevModeContext)
}

type Props = {
  children: React.ReactNode
  title?: string
}

export default function DevPanel({ children, title = 'Dev Tools' }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const { isDevMode, logout } = useDevModeControls()

  if (!isDevMode) return null

  return (
    <div className="dev-panel">
      <div className="dev-panel-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="dev-icon">🛠️</span>
        <span>{title}</span>
        <span className="dev-toggle">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
        <div className="dev-panel-content">
          {children}
          <div className="dev-section">
            <button className="dev-btn dev-btn-danger" onClick={logout} style={{ width: '100%' }}>
              🔒 Exit Dev Mode
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DevButton({ onClick, children, variant = 'default' }: { 
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning'
}) {
  return (
    <button className={`dev-btn dev-btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  )
}

export function DevInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="dev-info">
      <span className="dev-info-label">{label}:</span>
      <span className="dev-info-value">{value}</span>
    </div>
  )
}

export function DevSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dev-section">
      <div className="dev-section-title">{title}</div>
      {children}
    </div>
  )
}
