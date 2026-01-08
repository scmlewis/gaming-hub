import React, { useEffect, useState } from 'react'
import GameCard from '../components/GameCard'

const games = [
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Fill the grid so every row, column, and box contains unique numbers. Choose from 6×6 or 9×9 puzzles!',
    icon: '🧩',
    to: '/sudoku',
    color: '#8b5cf6'
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    description: 'Uncover cells without hitting mines. Use number clues to navigate safely.',
    icon: '💣',
    to: '/minesweeper',
    color: '#f43f5e'
  },
  {
    id: '2048',
    title: '2048',
    description: 'Slide and combine tiles to reach 2048. How high can you score?',
    icon: '🎯',
    to: '/2048',
    color: '#f59e0b'
  },
  {
    id: 'wordle',
    title: 'Wordle',
    description: 'Guess the 5-letter word in 6 tries. Colors reveal your progress.',
    icon: '✨',
    to: '/wordle',
    color: '#22c55e'
  }
]

export default function Home() {
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
    <div className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <span className="brand-icon">🎮</span>
          <h1>Gaming Hub</h1>
        </div>
        <p className="home-tagline">Classic puzzle games, beautifully crafted</p>
        <div className="theme-toggle">
          <button 
            onClick={cycleTheme}
            className="theme-btn"
            aria-label="Toggle theme"
            title={`Current: ${theme} theme`}
          >
            {getThemeIcon()}
          </button>
        </div>
      </header>

      <section className="games-grid">
        {games.map(game => (
          <GameCard key={game.id} {...game} />
        ))}
      </section>

      <footer className="home-footer">
        <p>Built with React + TypeScript • Made with ❤️</p>
      </footer>
    </div>
  )
}
