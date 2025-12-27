import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  description: string
  icon: string
  to: string
  color: string
}

export default function GameCard({ title, description, icon, to, color }: Props) {
  return (
    <Link 
      to={to} 
      className="game-card" 
      style={{ 
        '--card-accent': color,
        '--card-glow': `${color}30`
      } as React.CSSProperties}
    >
      <div className="game-card-icon" style={{ borderColor: `${color}20` }}>
        {icon}
      </div>
      <div className="game-card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="game-card-arrow" style={{ '--arrow-color': color } as React.CSSProperties}>
        →
      </div>
    </Link>
  )
}
