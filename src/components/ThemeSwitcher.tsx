import React, { useState, useEffect } from 'react'

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const cycleTheme = () => {
    setTheme(t => {
      if (t === 'dark') return 'light'
      if (t === 'light') return 'high-contrast'
      return 'dark'
    })
  }

  const getThemeIcon = () => {
    if (theme === 'dark') return '☀️'
    if (theme === 'light') return '🌓'
    return '🌙'
  }

  return (
    <button 
      className="theme-toggle-button" 
      onClick={cycleTheme}
      aria-label={`Switch theme (current: ${theme})`}
      title="Toggle theme"
    >
      {getThemeIcon()}
    </button>
  )
}
