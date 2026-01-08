import React, { useCallback, useEffect, useState } from 'react'
import GameLayout from '../components/GameLayout'
import Dropdown from '../components/Dropdown'
import DevPanel, { DevButton, DevInfo, DevSection, useDevMode } from '../components/DevPanel'
import { STORAGE_KEYS, MINESWEEPER_MAX_ROWS, MINESWEEPER_MAX_COLS } from '../constants'
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
  chordReveal
} from '../utils/minesweeper'

const NUMBER_CLASSES: Record<number, string> = {
  1: 'number-1',
  2: 'number-2',
  3: 'number-3',
  4: 'number-4',
  5: 'number-5',
  6: 'number-6',
  7: 'number-7',
  8: 'number-8'
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function MinesweeperPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | 'custom'>('easy')
  const [customConfig, setCustomConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MINESWEEPER_CUSTOM)
    return saved ? JSON.parse(saved) : { rows: 16, cols: 16, mines: 40 }
  })
  const [grid, setGrid] = useState<MineGrid | null>(null)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting')
  const [time, setTime] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showMines, setShowMines] = useState(false)
  const isDevMode = useDevMode()

  const config = difficulty === 'custom' ? customConfig : DIFFICULTIES[difficulty]

  // Save custom config to localStorage
  useEffect(() => {
    if (difficulty === 'custom') {
      localStorage.setItem(STORAGE_KEYS.MINESWEEPER_CUSTOM, JSON.stringify(customConfig))
    }
  }, [customConfig, difficulty])

  const startNewGame = useCallback(() => {
    setGrid(null)
    setGameState('waiting')
    setTime(0)
    setTimerRunning(false)
  }, [])

  useEffect(() => {
    startNewGame()
  }, [difficulty, startNewGame])

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setTime(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  function handleCellClick(row: number, col: number, isMiddleClick = false) {
    if (gameState === 'won' || gameState === 'lost') return

    let currentGrid = grid
    if (!currentGrid) {
      // First click - generate grid avoiding this cell
      currentGrid = createGrid(config.rows, config.cols, config.mines, [row, col])
      setGameState('playing')
      setTimerRunning(true)
    }

    if (currentGrid[row][col].isFlagged && !isMiddleClick) return

    // Chord clicking: middle-click or click on revealed cell with satisfied numbers
    if (isMiddleClick && currentGrid[row][col].isRevealed) {
      const newGrid = chordReveal(currentGrid, row, col)
      setGrid(newGrid)

      if (checkLose(newGrid)) {
        setGrid(revealAllMines(newGrid))
        setGameState('lost')
        setTimerRunning(false)
      } else if (checkWin(newGrid)) {
        setGameState('won')
        setTimerRunning(false)
      }
      return
    }

    const newGrid = revealCell(currentGrid, row, col)
    setGrid(newGrid)

    if (checkLose(newGrid)) {
      setGrid(revealAllMines(newGrid))
      setGameState('lost')
      setTimerRunning(false)
    } else if (checkWin(newGrid)) {
      setGameState('won')
      setTimerRunning(false)
    }
  }

  function handleRightClick(e: React.MouseEvent, row: number, col: number) {
    e.preventDefault()
    if (gameState !== 'playing' || !grid) return
    if (grid[row][col].isRevealed) return
    setGrid(toggleFlag(grid, row, col))
  }

  function handleMiddleClick(e: React.MouseEvent, row: number, col: number) {
    e.preventDefault()
    if (e.button === 1) {
      // Middle mouse button
      handleCellClick(row, col, true)
    }
  }

  function handleCustomConfigChange(field: 'rows' | 'cols' | 'mines', value: string) {
    const num = parseInt(value) || 0
    setCustomConfig((prev: { rows: number; cols: number; mines: number }) => {
      const updated = { ...prev, [field]: num }
      
      // Validate constraints
      if (field === 'rows') updated.rows = Math.min(Math.max(5, num), MINESWEEPER_MAX_ROWS)
      if (field === 'cols') updated.cols = Math.min(Math.max(5, num), MINESWEEPER_MAX_COLS)
      if (field === 'mines') {
        const maxMines = (updated.rows * updated.cols) - 9 // Leave room for first click safety
        updated.mines = Math.min(Math.max(1, num), maxMines)
      }
      
      return updated
    })
  }

  const flagCount = grid ? countFlags(grid) : 0
  const minesRemaining = config.mines - flagCount

  const displayGrid = grid || createEmptyDisplay(config.rows, config.cols)

  function createEmptyDisplay(rows: number, cols: number) {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      }))
    )
  }

  return (
    <GameLayout title="Minesweeper" color="#f43f5e" icon="💣">
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
            onChange={v => setDifficulty(v as Difficulty | 'custom')}
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
                onChange={e => handleCustomConfigChange('rows', e.target.value)}
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
                onChange={e => handleCustomConfigChange('cols', e.target.value)}
                className="game-input"
                style={{ width: '60px' }}
              />
            </label>
            <label>
              Mines:
              <input
                type="number"
                min="1"
                max={(customConfig.rows * customConfig.cols) - 9}
                value={customConfig.mines}
                onChange={e => handleCustomConfigChange('mines', e.target.value)}
                className="game-input"
                style={{ width: '60px' }}
              />
            </label>
          </div>
        )}
        <div className="toolbar-group">
          <button onClick={startNewGame} className="btn-primary">✨ New Game</button>
        </div>
      </div>

      <div className="minesweeper-container">
        <div className="minesweeper-stats">
          <div className="stat">
            <span className="stat-icon">⚙️</span>
            <div className="stat-display">
              <span className="stat-ghost">88</span>
              <span className="stat-value">{minesRemaining.toString().padStart(2, '0')}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">⏱️</span>
            <div className="stat-display">
              <span className="stat-ghost">88:88:88</span>
              <span className="stat-value">{formatTime(time)}</span>
            </div>
          </div>
        </div>

      {(gameState === 'won' || gameState === 'lost') && (
        <div className={`game-message ${gameState}`}>
          {gameState === 'won' ? '🎉 You Win!' : '💥 Game Over!'}
          <button onClick={startNewGame} className="btn-primary" style={{ marginLeft: 12 }}>
            Play Again
          </button>
        </div>
      )}

        <div 
          className="minesweeper-grid"
          style={{ 
            gridTemplateColumns: `repeat(${config.cols}, var(--mine-cell-size))`,
            gridTemplateRows: `repeat(${config.rows}, var(--mine-cell-size))`,
            '--grid-cols': config.cols
          } as React.CSSProperties}
        >
          {displayGrid.map((row, r) =>
            row.map((cell, c) => {
              let touchTimer: number | null = null
              
              return (
              <button
                key={`${r}-${c}`}
                className={`mine-cell ${cell.isRevealed ? 'revealed' : ''} ${cell.isFlagged ? 'flagged' : ''} ${cell.isMine && cell.isRevealed ? 'mine' : ''} ${showMines && cell.isMine && !cell.isRevealed ? 'dev-show-mine' : ''}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={e => handleRightClick(e, r, c)}
                onMouseDown={e => handleMiddleClick(e, r, c)}
                onTouchStart={(e) => {
                  e.preventDefault()
                  touchTimer = setTimeout(() => {
                    handleRightClick(e as any, r, c)
                    touchTimer = null
                  }, 500)
                }}
                onTouchEnd={(e) => {
                  if (touchTimer) {
                    clearTimeout(touchTimer)
                    handleCellClick(r, c)
                  }
                  e.preventDefault()
                }}
                onTouchMove={() => {
                  if (touchTimer) {
                    clearTimeout(touchTimer)
                    touchTimer = null
                  }
                }}
                disabled={gameState === 'won' || gameState === 'lost'}
              >
                {cell.isRevealed ? (
                  cell.isMine ? '💣' : (
                    cell.adjacentMines > 0 ? (
                      <span className={NUMBER_CLASSES[cell.adjacentMines]}>
                        {cell.adjacentMines}
                      </span>
                    ) : ''
                  )
                ) : cell.isFlagged ? (
                  <span className="flag-icon">⚑</span>
                ) : ''}
              </button>
              )
            })
          )}
        </div>
      </div>

      <div className="game-instructions">
        <p>
          <span className="desktop-only">Left-click to reveal • Right-click to flag • Middle-click for chord</span>
          <span className="mobile-only">Tap to reveal • Long-press to flag</span>
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
            <DevButton onClick={() => setShowMines(!showMines)} variant={showMines ? 'warning' : 'default'}>
              {showMines ? '👁️ Mines Visible' : '👁‍🗨️ Show Mines'}
            </DevButton>
            <DevButton onClick={() => {
              if (grid) {
                // Reveal all non-mine cells to win
                const newGrid = grid.map(row => row.map(cell => ({
                  ...cell,
                  isRevealed: !cell.isMine ? true : cell.isRevealed,
                  isFlagged: cell.isMine ? true : cell.isFlagged
                })))
                setGrid(newGrid)
                setGameState('won')
                setTimerRunning(false)
              }
            }} variant="success">
              🏆 Force Win
            </DevButton>
            <DevButton onClick={() => {
              if (grid) {
                setGrid(revealAllMines(grid))
                setGameState('lost')
                setTimerRunning(false)
              }
            }} variant="danger">
              💥 Force Lose
            </DevButton>
            <DevButton onClick={() => {
              // Generate grid immediately without waiting for first click
              const newGrid = createGrid(config.rows, config.cols, config.mines)
              setGrid(newGrid)
              setGameState('playing')
              setTime(0)
              setTimerRunning(true)
            }} variant="default">
              🎲 Generate Grid Now
            </DevButton>
            <DevButton onClick={startNewGame} variant="default">
              🔄 Reset Game
            </DevButton>
          </div>
        </DevSection>
      </DevPanel>
    </GameLayout>
  )
}
