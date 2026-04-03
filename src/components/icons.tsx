import React from 'react'

type IconName =
  | 'brand'
  | 'sudoku'
  | 'minesweeper'
  | 'game2048'
  | 'wordle'
  | 'sun'
  | 'moon'
  | 'contrast'
  | 'settings'

type Props = {
  name: IconName
  size?: number
  className?: string
}

export default function Icon({ name, size = 28, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    className,
    stroke: 'currentColor',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'brand':
      return (
        <svg {...common}>
          <path d="M7 8h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
          <path d="M8 12h2M7 14h2M14 12h0M17 12h0" />
          <path d="M9 9l-2-2M15 9l2-2" />
        </svg>
      )
    case 'sudoku':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      )
    case 'minesweeper':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="6" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 5l-2 2M5 19l2-2M17 19l-2-2" />
        </svg>
      )
    case 'game2048':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 8h8M8 12h8M8 16h8" />
        </svg>
      )
    case 'wordle':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9l2 6 2-6 2 6 2-6" />
        </svg>
      )
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 4.5l-2 2M4.5 19.5l2-2M17.5 19.5l-2-2" />
        </svg>
      )
    case 'moon':
      return (
        <svg {...common}>
          <path d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z" />
        </svg>
      )
    case 'contrast':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      )
    default:
      return null
  }
}
