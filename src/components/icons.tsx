import React from 'react';

type IconName =
  | 'brand'
  | 'sudoku'
  | 'minesweeper'
  | 'game2048'
  | 'wordle'
  | 'nonogram'
  | 'sun'
  | 'moon'
  | 'contrast'
  | 'settings'
  | 'volume'
  | 'volumeX'
  | 'tetris'
  | 'github';

type Props = {
  name: IconName;
  size?: number;
  className?: string;
};

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
    'aria-hidden': true,
    focusable: false,
  };

  switch (name) {
    case 'brand':
      return (
        <svg {...common}>
          <path d="M7 8h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
          <path d="M8 12h2M7 14h2M14 12h0M17 12h0" />
          <path d="M9 9l-2-2M15 9l2-2" />
        </svg>
      );
    case 'sudoku':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      );
    case 'minesweeper':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="6" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 5l-2 2M5 19l2-2M17 19l-2-2" />
        </svg>
      );
    case 'game2048':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 8h8M8 12h8M8 16h8" />
        </svg>
      );
    case 'wordle':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9l2 6 2-6 2 6 2-6" />
        </svg>
      );
    case 'nonogram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="3" y="3" width="5" height="5" fill="currentColor" stroke="none" />
          <rect x="13" y="3" width="5" height="5" fill="currentColor" stroke="none" />
          <rect x="8" y="8" width="5" height="5" fill="currentColor" stroke="none" />
          <rect x="3" y="13" width="5" height="5" fill="currentColor" stroke="none" />
          <rect x="13" y="13" width="5" height="5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'snake':
      return (
        <svg {...common}>
          <path d="M4 12c0-4 4-8 8-8s8 4 8 0-4-8-8-8" />
          <circle cx="8" cy="4" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 4.5l-2 2M4.5 19.5l2-2M17.5 19.5l-2-2" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z" />
        </svg>
      );
    case 'contrast':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case 'volume':
      return (
        <svg {...common}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );
    case 'volumeX':
      return (
        <svg {...common}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      );
    case 'tetris':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="3" y="15" width="6" height="6" rx="1" />
          <rect x="15" y="3" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      );
    case 'github':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    default:
      return null;
  }
}
