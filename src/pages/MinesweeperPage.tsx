import React, { useCallback, useEffect, useState } from 'react';
import GameLayout from '../components/GameLayout';
import Icon from '../components/icons';
import Dropdown from '../components/Dropdown';
import DevPanel, { DevButton, DevInfo, DevSection } from '../components/DevPanel';
import { STORAGE_KEYS, MINESWEEPER_MAX_ROWS, MINESWEEPER_MAX_COLS } from '../constants';
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

const NUMBER_CLASSES: Record<number, string> = {
  1: 'number-1',
  2: 'number-2',
  3: 'number-3',
  4: 'number-4',
  5: 'number-5',
  6: 'number-6',
  7: 'number-7',
  8: 'number-8',
};

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

export default function MinesweeperPage() {
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

  const triggerHaptic = (ms: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

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

  function handleCellClick(row: number, col: number, isMiddleClick = false) {
    if (gameState === 'won' || gameState === 'lost') return;

    let currentGrid = grid;
    if (!currentGrid) {
      // First click - generate grid avoiding this cell
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
      return;
    }

    if (currentGrid[row][col].isFlagged && !isMiddleClick) return;

    // Chord clicking: middle-click or click on revealed cell with satisfied numbers
    if (isMiddleClick && currentGrid[row][col].isRevealed) {
      const newGrid = chordReveal(currentGrid, row, col);
      setGrid(newGrid);

      if (checkLose(newGrid)) {
        setGrid(revealAllMines(newGrid));
        setGameState('lost');
        setTimerRunning(false);
      } else if (checkWin(newGrid)) {
        setGameState('won');
        setTimerRunning(false);
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
    } else if (checkWin(newGrid)) {
      setGameState('won');
      setTimerRunning(false);
    }
  }

  function handleCustomConfigChange(field: 'rows' | 'cols' | 'mines', value: string) {
    const num = parseInt(value) || 0;
    setCustomConfig((prev: { rows: number; cols: number; mines: number }) => {
      const updated = { ...prev, [field]: num };

      // Validate constraints
      if (field === 'rows') updated.rows = Math.min(Math.max(5, num), MINESWEEPER_MAX_ROWS);
      if (field === 'cols') updated.cols = Math.min(Math.max(5, num), MINESWEEPER_MAX_COLS);
      if (field === 'mines') {
        const maxMines = updated.rows * updated.cols - 9; // Leave room for first click safety
        updated.mines = Math.min(Math.max(1, num), maxMines);
      }

      return updated;
    });
  }

  const flagCount = grid ? countFlags(grid) : 0;
  const minesRemaining = config.mines - flagCount;

  // Prevent duplicate toggles from multiple event types firing in quick succession
  const lastToggleRef = React.useRef<Map<string, number>>(new Map());

  function toggleFlagSafe(row: number, col: number) {
    const key = `${row}-${col}`;
    const now = Date.now();
    const prev = lastToggleRef.current.get(key) || 0;
    if (now - prev < 250) return;
    lastToggleRef.current.set(key, now);
    if (!grid) return;
    if (grid[row][col].isRevealed) return;
    setGrid(toggleFlag(grid, row, col));
    triggerHaptic(10);
  }

  const displayGrid = grid || createEmptyDisplay(config.rows, config.cols);

  function createEmptyDisplay(rows: number, cols: number) {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );
  }

  return (
    <GameLayout title="Minesweeper" color="#f43f5e" icon={<Icon name="minesweeper" />}>
      <div className="game-toolbar">
        <div className="toolbar-group">
          <Dropdown
            ariaLabel="Select difficulty"
            value={difficulty}
            options={[
              { value: 'easy', label: 'Easy (9×9)' },
              { value: 'medium', label: 'Medium (16×16)' },
              { value: 'hard', label: 'Hard (16×30)' },
              { value: 'custom', label: 'Custom' },
            ]}
            onChange={(v) => setDifficulty(v as Difficulty | 'custom')}
          />
        </div>
        {difficulty === 'custom' && (
          <div className="toolbar-group custom-config">
            <label>
              Rows:
              <input
                type="number"
                min="5"
                max={MINESWEEPER_MAX_ROWS}
                value={customConfig.rows}
                onChange={(e) => handleCustomConfigChange('rows', e.target.value)}
                className="game-input"
                style={{ width: '60px' }}
              />
            </label>
            <label>
              Cols:
              <input
                type="number"
                min="5"
                max={MINESWEEPER_MAX_COLS}
                value={customConfig.cols}
                onChange={(e) => handleCustomConfigChange('cols', e.target.value)}
                className="game-input"
                style={{ width: '60px' }}
              />
            </label>
            <label>
              Mines:
              <input
                type="number"
                min="1"
                max={customConfig.rows * customConfig.cols - 9}
                value={customConfig.mines}
                onChange={(e) => handleCustomConfigChange('mines', e.target.value)}
                className="game-input"
                style={{ width: '60px' }}
              />
            </label>
          </div>
        )}
        <div className="toolbar-group">
          <button onClick={startNewGame} className="btn-primary">
            New Game
          </button>
          <button
            onClick={() => setFlagMode((v) => !v)}
            className="btn-secondary mobile-only"
            aria-pressed={flagMode}
            title={flagMode ? 'Switch to reveal mode' : 'Switch to flag mode'}
          >
            {flagMode ? 'Flag Mode' : 'Reveal Mode'}
          </button>
        </div>
      </div>

      <div className="minesweeper-container">
        <div className="minesweeper-stats">
          <div className="stat" title="Mines remaining to flag">
            <span className="stat-icon">⚙️</span>
            <div className="stat-display">
              <span className="stat-ghost">88</span>
              <span className="stat-value">{minesRemaining.toString().padStart(2, '0')}</span>
            </div>
            <span className="stat-label mobile-only">Mines</span>
          </div>
          <div className="stat" title="Elapsed time">
            <span className="stat-icon">⏱️</span>
            <div className="stat-display">
              <span className="stat-ghost">88:88:88</span>
              <span className="stat-value">{formatTime(time)}</span>
            </div>
            <span className="stat-label mobile-only">Time</span>
          </div>
          {grid && (
            <div className="stat" title="Cells revealed">
              <span className="stat-label-text">Progress</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.round(
                      (grid.flat().filter((c) => c.isRevealed).length /
                        (config.rows * config.cols)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {(gameState === 'won' || gameState === 'lost') && (
          <div className={`game-message ${gameState}`}>
            {gameState === 'won' ? '🎉 You Win!' : '💥 Game Over!'}
            <button onClick={startNewGame} className="btn-primary" style={{ marginLeft: 12 }}>
              Play Again
            </button>
          </div>
        )}

        {gameState === 'waiting' && (
          <div
            className="game-message waiting"
            style={{
              textAlign: 'center',
              padding: '30px 20px',
              borderRadius: '8px',
              background: 'rgba(100, 120, 180, 0.1)',
            }}
          >
            <p style={{ fontSize: '1.1rem', marginBottom: '12px', fontWeight: 500 }}>
              Ready to play?
            </p>
            <p style={{ fontSize: '0.95rem', marginBottom: '18px', opacity: 0.85 }}>
              Click any cell to start the timer and begin revealing
            </p>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.6 }}>
              <div className="desktop-only">
                💡 Left-click to reveal • Right-click/Long-press to flag
              </div>
              <div className="mobile-only">
                💡 Tap to reveal • Long-press to flag • Use Flag Mode for faster marking
              </div>
            </div>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="game-message waiting">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '10px', opacity: 0.9 }}>
                <strong>Ready to play?</strong>
              </p>
              <p style={{ fontSize: '0.95rem', marginBottom: '16px', opacity: 0.7 }}>
                Click any cell to start the game
              </p>
              <p style={{ fontSize: '0.85rem', color: '#8b8e99' }}>
                <span className="desktop-only">
                  💡 Left-click to reveal • Right-click to flag • Middle-click for chord reveal
                </span>
                <span className="mobile-only">💡 Tap to reveal • Long-press to flag</span>
              </p>
            </div>
          </div>
        )}

        <div className="minesweeper-grid-wrap">
          <div className="minesweeper-hint mobile-only">Drag to pan for large boards</div>
          <div
            className="minesweeper-grid"
            onContextMenu={(e) => e.preventDefault()} /* prevent browser context menu inside grid */
            style={
              {
                gridTemplateColumns: `repeat(${config.cols}, var(--mine-cell-size))`,
                gridTemplateRows: `repeat(${config.rows}, var(--mine-cell-size))`,
                '--grid-cols': config.cols,
              } as React.CSSProperties
            }
          >
            {displayGrid.map((row, r) =>
              row.map((cell, c) => {
                let pointerTimer: number | null = null;

                const onAux = (e: React.MouseEvent) => {
                  // handle middle/right clicks consistently
                  // prevent default context menu
                  e.preventDefault();
                  if (e.button === 1) {
                    handleCellClick(r, c, true);
                  } else if (e.button === 2) {
                    toggleFlagSafe(r, c);
                  }
                };

                const onPointerDown = (e: React.PointerEvent) => {
                  // For touch, start long-press timer to toggle flag
                  if (e.pointerType === 'touch') {
                    // prevent default to avoid browser context menu on long-press
                    e.preventDefault();
                    pointerTimer = window.setTimeout(() => {
                      if (gameState === 'playing' && grid && !grid[r][c].isRevealed)
                        setGrid(toggleFlag(grid, r, c));
                      pointerTimer = null;
                    }, 500);
                  }
                };

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const onPointerUp = (_e: React.PointerEvent) => {
                  if (pointerTimer) {
                    clearTimeout(pointerTimer as number);
                    pointerTimer = null;
                    // treat as a normal tap/click
                    handleCellClick(r, c);
                  }
                };

                const onPointerMove = () => {
                  if (pointerTimer) {
                    clearTimeout(pointerTimer as number);
                    pointerTimer = null;
                  }
                };

                return (
                  <button
                    key={`${r}-${c}`}
                    className={`mine-cell ${cell.isRevealed ? 'revealed' : ''} ${
                      cell.isFlagged ? 'flagged' : ''
                    } ${cell.isMine && cell.isRevealed ? 'mine' : ''} ${
                      showMines && cell.isMine && !cell.isRevealed ? 'dev-show-mine' : ''
                    }`}
                    onClick={() => handleCellClick(r, c)}
                    onAuxClick={onAux}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleFlagSafe(r, c);
                    }}
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    onPointerMove={onPointerMove}
                    disabled={gameState === 'won' || gameState === 'lost'}
                  >
                    {cell.isRevealed ? (
                      cell.isMine ? (
                        '💣'
                      ) : cell.adjacentMines > 0 ? (
                        <span className={NUMBER_CLASSES[cell.adjacentMines]}>
                          {cell.adjacentMines}
                        </span>
                      ) : (
                        ''
                      )
                    ) : cell.isFlagged ? (
                      <span className="flag-icon">⚑</span>
                    ) : (
                      ''
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="game-instructions">
        <p>
          <span className="desktop-only">
            Left-click to reveal • Right-click to flag • Middle-click for chord
          </span>
          <span className="mobile-only">
            Tap to reveal • Long-press to flag • Use Flag Mode for faster marking
          </span>
        </p>
      </div>

      <DevPanel title="Minesweeper Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Difficulty" value={difficulty} />
          <DevInfo label="Grid Size" value={`${config.rows}×${config.cols}`} />
          <DevInfo label="Mines" value={config.mines} />
          <DevInfo label="Flags" value={grid ? countFlags(grid) : 0} />
          <DevInfo label="Time" value={`${time}s`} />
          <DevInfo label="State" value={gameState} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <DevButton
              onClick={() => setShowMines(!showMines)}
              variant={showMines ? 'warning' : 'default'}
            >
              {showMines ? '👁️ Mines Visible' : '👁‍🗨️ Show Mines'}
            </DevButton>
            <DevButton
              onClick={() => {
                if (grid) {
                  // Reveal all non-mine cells to win
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
              }}
              variant="success"
            >
              🏆 Force Win
            </DevButton>
            <DevButton
              onClick={() => {
                if (grid) {
                  setGrid(revealAllMines(grid));
                  setGameState('lost');
                  setTimerRunning(false);
                }
              }}
              variant="danger"
            >
              💥 Force Lose
            </DevButton>
            <DevButton
              onClick={() => {
                // Generate grid immediately without waiting for first click
                const newGrid = createGrid(config.rows, config.cols, config.mines);
                setGrid(newGrid);
                setGameState('playing');
                setTime(0);
                setTimerRunning(true);
              }}
              variant="default"
            >
              🎲 Generate Grid Now
            </DevButton>
            <DevButton onClick={startNewGame} variant="default">
              🔄 Reset Game
            </DevButton>
          </div>
        </DevSection>
      </DevPanel>
    </GameLayout>
  );
}
