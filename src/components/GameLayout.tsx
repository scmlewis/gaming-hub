import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  children: React.ReactNode
  color?: string
  icon?: React.ReactNode
}

export default function GameLayout({ title, children, color = '#6366f1', icon }: Props) {
  // Convert hex to RGB values
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '99, 102, 241';
  };

  return (
    <div 
      className="game-layout" 
      style={{ 
        '--game-accent': color,
        '--game-accent-rgb': hexToRgb(color),
        '--accent': color,
        '--accent-glow': `${color}40`
      } as React.CSSProperties}
    >
      <header className="game-header">
        <Link to="/" className="back-button" aria-label="Back to home">
          <span className="back-icon">←</span>
          <span className="back-text">Home</span>
        </Link>
        <h1 className="game-title">
          {icon && <span className="game-title-icon">{icon}</span>}
          {title}
        </h1>
        <div className="header-spacer" />
      </header>
      <main className="game-content">
        {children}
      </main>
    </div>
  )
}
