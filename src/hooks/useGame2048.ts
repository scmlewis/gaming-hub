import { useCallback, useEffect, useState, useRef } from 'react';
import { STORAGE_KEYS, MAX_MOVE_HISTORY } from '../constants';
import { recordGame } from '../utils/stats';
import { TILE_THEMES } from '../utils/themes2048';
import { audioService } from '../utils/audio';
import {
  Grid2048,
  initGame,
  move,
  addRandomTile,
  canMove,
  hasWon,
  getTileColor,
  getTileTextColor,
  calculateBestMove,
  HintResult,
} from '../utils/game2048';

// Tile with tracking for animations
interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerging?: boolean;
}

let nextTileId = 1;

// Convert grid to tiles array for initial state
function createTilesFromGrid(grid: Grid2048): Tile[] {
  const tiles: Tile[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] !== null) {
        tiles.push({
          id: nextTileId++,
          value: grid[r][c]!,
          row: r,
          col: c,
          isNew: true,
        });
      }
    }
  }
  return tiles;
}

export default function useGame2048() {
  const [grid, setGrid] = useState<Grid2048>(() => initGame());
  const [tiles, setTiles] = useState<Tile[]>(() => createTilesFromGrid(initGame()));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GAME_2048_BEST);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [tileTheme, setTileTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.GAME_2048_THEME) || 'classic';
  });
  const [moveHistory, setMoveHistory] = useState<Array<{ grid: Grid2048; score: number }>>([]);
  const [hint, setHint] = useState<HintResult | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [muted, setMuted] = useState(() => audioService.isMuted());
  const [showConfetti, setShowConfetti] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const isAnimating = useRef(false);

  const toggleMute = () => {
    const nextVal = audioService.toggleMute();
    setMuted(nextVal);
  };

  const triggerHaptic = (ms: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  // Initialize on mount - sync grid and tiles
  useEffect(() => {
    const initialGrid = initGame();
    nextTileId = 1;
    setGrid(initialGrid);
    setTiles(createTilesFromGrid(initialGrid));
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAME_2048_THEME, tileTheme);
  }, [tileTheme]);

  const startNewGame = useCallback(() => {
    const newGrid = initGame();
    nextTileId = 1;
    setGrid(newGrid);
    setTiles(createTilesFromGrid(newGrid));
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setMoveHistory([]);
    setHint(null);
  }, []);

  const handleMove = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (gameOver || (won && !keepPlaying) || isAnimating.current) return;

      const { grid: newGrid, score: addedScore, moved } = move(grid, direction);

      if (!moved) return;

      triggerHaptic(8);

      if (addedScore > 0) {
        audioService.playSuccess();
      } else {
        audioService.playMove();
      }

      setHint(null);

      isAnimating.current = true;

      const movedTiles: Tile[] = [];

      if (direction === 'left' || direction === 'right') {
        for (let r = 0; r < 4; r++) {
          const rowTiles = tiles
            .filter((t) => t.row === r)
            .sort((a, b) => (direction === 'left' ? a.col - b.col : b.col - a.col));
          let targetCol = direction === 'left' ? 0 : 3;
          const step = direction === 'left' ? 1 : -1;

          for (const tile of rowTiles) {
            while (targetCol >= 0 && targetCol < 4) {
              if (newGrid[r][targetCol] !== null) {
                movedTiles.push({
                  ...tile,
                  col: targetCol,
                  isNew: false,
                  isMerging: newGrid[r][targetCol] !== tile.value,
                });
                targetCol += step;
                break;
              }
              targetCol += step;
            }
          }
        }
      } else {
        for (let c = 0; c < 4; c++) {
          const colTiles = tiles
            .filter((t) => t.col === c)
            .sort((a, b) => (direction === 'up' ? a.row - b.row : b.row - a.row));
          let targetRow = direction === 'up' ? 0 : 3;
          const step = direction === 'up' ? 1 : -1;

          for (const tile of colTiles) {
            while (targetRow >= 0 && targetRow < 4) {
              if (newGrid[targetRow][c] !== null) {
                movedTiles.push({
                  ...tile,
                  row: targetRow,
                  isNew: false,
                  isMerging: newGrid[targetRow][c] !== tile.value,
                });
                targetRow += step;
                break;
              }
              targetRow += step;
            }
          }
        }
      }

      setTiles(movedTiles);

      setTimeout(() => {
        const withNewTile = addRandomTile(newGrid);
        setGrid(withNewTile);

        const finalTiles: Tile[] = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const value = withNewTile[r][c];
            if (value !== null) {
              const existingTile = movedTiles.find((t) => t.row === r && t.col === c);
              if (existingTile) {
                finalTiles.push({
                  id: existingTile.id,
                  value,
                  row: r,
                  col: c,
                  isNew: false,
                  isMerging: false,
                });
              } else {
                finalTiles.push({
                  id: nextTileId++,
                  value,
                  row: r,
                  col: c,
                  isNew: true,
                  isMerging: false,
                });
              }
            }
          }
        }
        setTiles(finalTiles);
        isAnimating.current = false;

        const newScore = score + addedScore;
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem(STORAGE_KEYS.GAME_2048_BEST, String(newScore));
        }

        setMoveHistory((prev) => {
          const newHistory = [
            ...prev,
            {
              grid: withNewTile.map((row) => [...row]),
              score: newScore,
            },
          ];
          return newHistory.slice(-MAX_MOVE_HISTORY);
        });

        if (!keepPlaying && hasWon(withNewTile)) {
          setWon(true);
          setShowConfetti(true);
          recordGame('game2048', true);
          audioService.playWin();
        } else if (!canMove(withNewTile)) {
          setGameOver(true);
          recordGame('game2048', false);
          audioService.playExplosion();
        }
      }, 100);
    },
    [grid, tiles, score, bestScore, gameOver, won, keepPlaying]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dir = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        handleMove(dir);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    e.preventDefault();
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 30) return;

    e.preventDefault();

    if (absDx > absDy) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
    setTouchStart(null);
  }

  const getTileFontClass = (value: number): string => {
    if (value >= 1000) return 'tile-font-sm';
    if (value >= 100) return 'tile-font-md';
    return '';
  };

  const handleUndo = () => {
    if (moveHistory.length === 0 || isAnimating.current) return;

    const newHistory = [...moveHistory];
    newHistory.pop();

    if (newHistory.length > 0) {
      const prevState = newHistory[newHistory.length - 1];
      setGrid(prevState.grid.map((row) => [...row]));
      setTiles(createTilesFromGrid(prevState.grid));
      setScore(prevState.score);
      setGameOver(false);
      setWon(false);
    } else {
      const initialGrid = initGame();
      nextTileId = 1;
      setGrid(initialGrid);
      setTiles(createTilesFromGrid(initialGrid));
      setScore(0);
      setGameOver(false);
      setWon(false);
    }

    setMoveHistory(newHistory);
    setHint(null);
  };

  const handleGetHint = () => {
    if (gameOver || isAnimating.current) return;
    const hintResult = calculateBestMove(grid);
    setHint(hintResult);
  };

  const getAccentColor = (themeName: string) => {
    const theme = TILE_THEMES[themeName];
    return theme?.colors[2048] || '#f59e0b';
  };

  return {
    // State
    grid,
    tiles,
    score,
    bestScore,
    gameOver,
    won,
    keepPlaying,
    tileTheme,
    moveHistory,
    hint,
    settingsOpen,
    muted,
    showConfetti,
    statsOpen,
    touchStart,
    isAnimating,
    // Setters
    setGrid,
    setTiles,
    setScore,
    setBestScore,
    setGameOver,
    setWon,
    setKeepPlaying,
    setTileTheme,
    setMoveHistory,
    setHint,
    setSettingsOpen,
    setMuted,
    setShowConfetti,
    setStatsOpen,
    setTouchStart,
    // Functions
    toggleMute,
    triggerHaptic,
    startNewGame,
    handleMove,
    handleUndo,
    handleGetHint,
    handleTouchStart,
    handleTouchEnd,
    getTileFontClass,
    getAccentColor,
    // Exposed for dev panel
    getTileColor: (value: number) => getTileColor(value, tileTheme),
    getTileTextColor: (value: number) => getTileTextColor(value, tileTheme),
  };
}
