/**
 * Application-wide constants
 */

export const TIMEOUTS = {
  INVALID_CELL_FLASH: 600,
  TOAST_DURATION: 2200,
  CHECK_MESSAGE: 1800,
  CHECK_WRONG_HIGHLIGHT: 1400,
  COMPLETED_MODAL_DELAY: 20,
} as const

export const STORAGE_KEYS = {
  SUDOKU_SAVE: 'sudoku-save-v1',
  THEME: 'theme',
  ACCENT: 'accent',
  COMPACT_SIDEBAR: 'compactSidebar',
  FIXED_CELL_STYLE: 'fixedCellStyle',
  PEER_HIGHLIGHT: 'peerHighlight',
  LARGE_FONT: 'largeFont',
} as const

export const DEFAULT_VALUES = {
  THEME: 'dark',
  ACCENT: 'blue',
  FIXED_CELL_STYLE: 'outlined' as const,
  PEER_HIGHLIGHT: true,
  LARGE_FONT: false,
  COMPACT_SIDEBAR: false,
} as const

export const CLUES_BY_DIFFICULTY_9X9 = {
  easy: 36,
  medium: 30,
  hard: 26,
} as const

export const MAX_HISTORY_SIZE = 100
export const MAX_SAVE_FILE_SIZE = 100 * 1024 // 100KB

