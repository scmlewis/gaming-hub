// Game statistics tracking with localStorage persistence

export type GameStats = {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayed: string; // ISO date string
};

export type AllStats = {
  sudoku: GameStats;
  minesweeper: GameStats;
  game2048: GameStats;
  wordle: GameStats;
  snake: GameStats;
  tetris: GameStats;
  nonogram: GameStats;
};

const STATS_KEY = 'gaming_hub_stats';

function getDefaultStats(): GameStats {
  return { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayed: '' };
}

function loadStats(): AllStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sudoku: { ...getDefaultStats(), ...parsed.sudoku },
        minesweeper: { ...getDefaultStats(), ...parsed.minesweeper },
        game2048: { ...getDefaultStats(), ...parsed.game2048 },
        wordle: { ...getDefaultStats(), ...parsed.wordle },
        snake: { ...getDefaultStats(), ...parsed.snake },
        tetris: { ...getDefaultStats(), ...parsed.tetris },
        nonogram: { ...getDefaultStats(), ...parsed.nonogram },
      };
    }
  } catch {
    // ignore corrupt data
  }
  return {
    sudoku: getDefaultStats(),
    minesweeper: getDefaultStats(),
    game2048: getDefaultStats(),
    wordle: getDefaultStats(),
    snake: getDefaultStats(),
    tetris: getDefaultStats(),
    nonogram: getDefaultStats(),
  };
}

function saveStats(stats: AllStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

export function recordGame(game: keyof AllStats, won: boolean) {
  const stats = loadStats();
  const entry = stats[game];
  const today = new Date().toISOString();

  entry.played += 1;
  entry.lastPlayed = today;

  if (won) {
    entry.won += 1;
    // Continue streak if played yesterday or today, otherwise reset
    if (isYesterday(entry.lastPlayed) || isToday(entry.lastPlayed)) {
      entry.currentStreak += 1;
    } else {
      entry.currentStreak = 1;
    }
    entry.maxStreak = Math.max(entry.maxStreak, entry.currentStreak);
  } else {
    // Reset streak on loss
    entry.currentStreak = 0;
  }

  stats[game] = entry;
  saveStats(stats);
}

export function getStats(game: keyof AllStats): GameStats {
  return loadStats()[game];
}

export function getAllStats(): AllStats {
  return loadStats();
}

export function getWinRate(game: keyof AllStats): number {
  const s = loadStats()[game];
  if (s.played === 0) return 0;
  return Math.round((s.won / s.played) * 100);
}
