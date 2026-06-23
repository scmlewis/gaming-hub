import { useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, MINESWEEPER_MAX_ROWS, MINESWEEPER_MAX_COLS } from '../constants';
import { recordGame } from '../utils/stats';
import { audioService } from '../utils/audio';
import {
  MineGrid,
  Difficulty,
  DIFFICULTIES,
  createGrid,
  revealCell,
  toggleFlag,
  checkWin,
  checkLose,
  revealAllMines,
  countFlags,
  chordReveal,
} from '../utils/minesweeper';

export default function useMinesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty | 'custom'>('easy');
  const [customConfig, setCustomConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MINESWEEPER_CUSTOM);
    return saved ? JSON.parse(saved) : { rows: 16, cols: 16, mines: 40 };
  });
  const [grid, setGrid] = useState<MineGrid | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showMines, setShowMines] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [muted, setMuted] = useState(() => audioService.isMuted());
  const [showConfetti, setShowConfetti] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const triggerHaptic = useCallback((ms: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextVal = audioService.toggleMute();
    setMuted(nextVal);
  }, []);

  const config = difficulty === 'custom' ? customConfig : DIFFICULTIES[difficulty];

  // Save custom config to localStorage
  useEffect(() => {
    if (difficulty === 'custom') {
      localStorage.setItem(STORAGE_KEYS.MINESWEEPER_CUSTOM, JSON.stringify(customConfig));
    }
  }, [customConfig, difficulty]);

  const startNewGame = useCallback(() => {
    setGrid(null);
    setGameState('waiting');
    setTime(0);
    setTimerRunning(false);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [difficulty, startNewGame]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const handleCellClick = useCallback(
    (row: number, col: number, isMiddleClick = false) => {
      if (gameState === 'won' || gameState === 'lost') return;

      let currentGrid = grid;
      if (!currentGrid) {
        currentGrid = createGrid(config.rows, config.cols, config.mines, [row, col]);
        setGameState('playing');
        setTimerRunning(true);
      }

      if (
        flagMode &&
        gameState === 'playing' &&
        currentGrid &&
        !currentGrid[row][col].isRevealed &&
        !isMiddleClick
      ) {
        setGrid(toggleFlag(currentGrid, row, col));
        triggerHaptic(10);
        audioService.playClick();
        return;
      }

      if (currentGrid[row][col].isFlagged && !isMiddleClick) return;

      if (isMiddleClick && currentGrid[row][col].isRevealed) {
        const newGrid = chordReveal(currentGrid, row, col);
        setGrid(newGrid);

        if (checkLose(newGrid)) {
          setGrid(revealAllMines(newGrid));
          setGameState('lost');
          setTimerRunning(false);
          recordGame('minesweeper', false);
          audioService.playExplosion();
        } else if (checkWin(newGrid)) {
          setGameState('won');
          setTimerRunning(false);
          setShowConfetti(true);
          recordGame('minesweeper', true);
          audioService.playWin();
        } else {
          audioService.playMove();
        }
        return;
      }

      const newGrid = revealCell(currentGrid, row, col);
      setGrid(newGrid);
      triggerHaptic(8);

      if (checkLose(newGrid)) {
        setGrid(revealAllMines(newGrid));
        setGameState('lost');
        setTimerRunning(false);
        recordGame('minesweeper', false);
        audioService.playExplosion();
      } else if (checkWin(newGrid)) {
        setGameState('won');
        setTimerRunning(false);
        setShowConfetti(true);
        recordGame('minesweeper', true);
        audioService.playWin();
      } else {
        audioService.playMove();
      }
    },
    [config.cols, config.mines, config.rows, flagMode, gameState, grid, triggerHaptic]
  );

  function handleCustomConfigChange(field: 'rows' | 'cols' | 'mines', value: string) {
    const num = parseInt(value) || 0;
    setCustomConfig((prev: { rows: number; cols: number; mines: number }) => {
      const updated = { ...prev, [field]: num };

      if (field === 'rows') updated.rows = Math.min(Math.max(5, num), MINESWEEPER_MAX_ROWS);
      if (field === 'cols') updated.cols = Math.min(Math.max(5, num), MINESWEEPER_MAX_COLS);
      if (field === 'mines') {
        const maxMines = updated.rows * updated.cols - 9;
        updated.mines = Math.min(Math.max(1, num), maxMines);
      }

      return updated;
    });
  }

  const flagCount = grid ? countFlags(grid) : 0;
  const minesRemaining = config.mines - flagCount;

  const toggleFlagSafe = useCallback(
    (row: number, col: number) => {
      if (!grid) return;
      if (grid[row][col].isRevealed) return;
      setGrid(toggleFlag(grid, row, col));
      triggerHaptic(10);
      audioService.playClick();
    },
    [grid, triggerHaptic]
  );

  const emptyDisplay = useMemo(
    () => createEmptyDisplay(config.rows, config.cols),
    [config.rows, config.cols]
  );
  const displayGrid = grid || emptyDisplay;

  function forceWin() {
    if (grid) {
      const newGrid = grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isRevealed: !cell.isMine ? true : cell.isRevealed,
          isFlagged: cell.isMine ? true : cell.isFlagged,
        }))
      );
      setGrid(newGrid);
      setGameState('won');
      setTimerRunning(false);
    }
  }

  function forceLose() {
    if (grid) {
      setGrid(revealAllMines(grid));
      setGameState('lost');
      setTimerRunning(false);
    }
  }

  function generateGridNow() {
    const newGrid = createGrid(config.rows, config.cols, config.mines);
    setGrid(newGrid);
    setGameState('playing');
    setTime(0);
    setTimerRunning(true);
  }

  return {
    // State
    difficulty,
    customConfig,
    grid,
    gameState,
    time,
    timerRunning,
    showMines,
    flagMode,
    muted,
    showConfetti,
    statsOpen,
    // Setters
    setDifficulty,
    setCustomConfig,
    setGameState,
    setTime,
    setTimerRunning,
    setShowMines,
    setFlagMode,
    setMuted,
    setShowConfetti,
    setStatsOpen,
    setGrid,
    // Computed
    config,
    flagCount,
    minesRemaining,
    emptyDisplay,
    displayGrid,
    // Functions
    startNewGame,
    handleCellClick,
    handleCustomConfigChange,
    toggleFlagSafe,
    triggerHaptic,
    toggleMute,
    forceWin,
    forceLose,
    generateGridNow,
  };
}

function createEmptyDisplay(rows: number, cols: number): MineGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}
