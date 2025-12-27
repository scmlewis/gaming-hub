import React, { useCallback, useEffect, useState, useRef } from 'react'
import GameLayout from '../components/GameLayout'
import DevPanel, { DevButton, DevInfo, DevSection, useDevMode } from '../components/DevPanel'
import {
  Grid2048,
  initGame,
  move,
  addRandomTile,
  canMove,
  hasWon,
  getTileColor,
  getTileTextColor
} from '../utils/game2048'

// Tile with tracking for animations
interface Tile {
  id: number
  value: number
  row: number
  col: number
  isNew?: boolean
  isMerging?: boolean
}

let nextTileId = 1

// Convert grid to tiles array for initial state
function createTilesFromGrid(grid: Grid2048): Tile[] {
  const tiles: Tile[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] !== null) {
        tiles.push({
          id: nextTileId++,
          value: grid[r][c]!,
          row: r,
          col: c,
          isNew: true
        })
      }
    }
  }
  return tiles
}

export default function Game2048Page() {
  const [grid, setGrid] = useState<Grid2048>(() => initGame())
  const [tiles, setTiles] = useState<Tile[]>(() => createTilesFromGrid(initGame()))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('2048-best')
    return saved ? parseInt(saved, 10) : 0
  })
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keepPlaying, setKeepPlaying] = useState(false)
  const isDevMode = useDevMode()
  const isAnimating = useRef(false)

  // Initialize on mount - sync grid and tiles
  useEffect(() => {
    const initialGrid = initGame()
    nextTileId = 1
    setGrid(initialGrid)
    setTiles(createTilesFromGrid(initialGrid))
  }, [])

  const startNewGame = useCallback(() => {
    const newGrid = initGame()
    nextTileId = 1
    setGrid(newGrid)
    setTiles(createTilesFromGrid(newGrid))
    setScore(0)
    setGameOver(false)
    setWon(false)
    setKeepPlaying(false)
  }, [])

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || (won && !keepPlaying) || isAnimating.current) return

    const { grid: newGrid, score: addedScore, moved } = move(grid, direction)
    
    if (!moved) return

    isAnimating.current = true

    // Move existing tiles to new positions
    const movedTiles: Tile[] = []
    const gridCopy = grid.map(row => [...row])
    
    // Track which tiles moved where based on direction
    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < 4; r++) {
        const rowTiles = tiles.filter(t => t.row === r).sort((a, b) => 
          direction === 'left' ? a.col - b.col : b.col - a.col
        )
        let targetCol = direction === 'left' ? 0 : 3
        const step = direction === 'left' ? 1 : -1
        
        for (const tile of rowTiles) {
          // Find where this tile ends up in newGrid
          while (targetCol >= 0 && targetCol < 4) {
            if (newGrid[r][targetCol] !== null) {
              movedTiles.push({
                ...tile,
                col: targetCol,
                isNew: false,
                isMerging: newGrid[r][targetCol] !== tile.value
              })
              targetCol += step
              break
            }
            targetCol += step
          }
        }
      }
    } else {
      for (let c = 0; c < 4; c++) {
        const colTiles = tiles.filter(t => t.col === c).sort((a, b) => 
          direction === 'up' ? a.row - b.row : b.row - a.row
        )
        let targetRow = direction === 'up' ? 0 : 3
        const step = direction === 'up' ? 1 : -1
        
        for (const tile of colTiles) {
          while (targetRow >= 0 && targetRow < 4) {
            if (newGrid[targetRow][c] !== null) {
              movedTiles.push({
                ...tile,
                row: targetRow,
                isNew: false,
                isMerging: newGrid[targetRow][c] !== tile.value
              })
              targetRow += step
              break
            }
            targetRow += step
          }
        }
      }
    }

    setTiles(movedTiles)

    // After slide animation, add new tile and update values
    setTimeout(() => {
      const withNewTile = addRandomTile(newGrid)
      setGrid(withNewTile)
      
      // Create final tile state with correct values and new tile
      const finalTiles: Tile[] = []
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const value = withNewTile[r][c]
          if (value !== null) {
            const existingTile = movedTiles.find(t => t.row === r && t.col === c)
            if (existingTile) {
              finalTiles.push({
                id: existingTile.id,
                value,
                row: r,
                col: c,
                isNew: false,
                isMerging: false
              })
            } else {
              // New tile spawned
              finalTiles.push({
                id: nextTileId++,
                value,
                row: r,
                col: c,
                isNew: true,
                isMerging: false
              })
            }
          }
        }
      }
      setTiles(finalTiles)
      isAnimating.current = false
      
      const newScore = score + addedScore
      setScore(newScore)
      
      if (newScore > bestScore) {
        setBestScore(newScore)
        localStorage.setItem('2048-best', String(newScore))
      }

      if (!keepPlaying && hasWon(withNewTile)) {
        setWon(true)
      } else if (!canMove(withNewTile)) {
        setGameOver(true)
      }
    }, 100)
  }, [grid, tiles, score, bestScore, gameOver, won, keepPlaying])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const dir = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right'
        handleMove(dir)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove])

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStart.x
    const dy = touch.clientY - touchStart.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (Math.max(absDx, absDy) < 30) return // Too short

    if (absDx > absDy) {
      handleMove(dx > 0 ? 'right' : 'left')
    } else {
      handleMove(dy > 0 ? 'down' : 'up')
    }
    setTouchStart(null)
  }

  // Get font size class based on tile value
  const getTileFontClass = (value: number): string => {
    if (value >= 1000) return 'tile-font-sm'
    if (value >= 100) return 'tile-font-md'
    return ''
  }

  return (
    <GameLayout title="2048" color="#f59e0b" icon="🎯">
      <div className="game-2048-header">
        <div className="game-2048-scores">
          <div className="game-2048-score-box">
            <div className="game-2048-score-label">SCORE</div>
            <div className="game-2048-score-value">{score}</div>
          </div>
          <div className="game-2048-score-box">
            <div className="game-2048-score-label">BEST</div>
            <div className="game-2048-score-value">{bestScore}</div>
          </div>
        </div>
        <button onClick={startNewGame} className="btn-primary game-2048-new-btn">✨ New Game</button>
      </div>

      {(gameOver || (won && !keepPlaying)) && (
        <div className={`game-message ${gameOver ? 'lost' : 'won'}`}>
          {gameOver ? 'Game Over!' : '🎉 You Win!'}
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={startNewGame} className="btn-primary">Try Again</button>
            {won && !keepPlaying && (
              <button onClick={() => setKeepPlaying(true)} className="btn-secondary">Keep Playing</button>
            )}
          </div>
        </div>
      )}

      <div 
        className="game-2048-grid"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background grid cells */}
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={`cell-${i}`} className="tile-2048-cell" />
        ))}
        
        {/* Animated tiles */}
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className={`tile-2048 tile-pos-${tile.row}-${tile.col}${tile.isNew ? ' tile-new' : ''}${tile.isMerging ? ' tile-merge' : ''} ${getTileFontClass(tile.value)}`}
            style={{
              backgroundColor: getTileColor(tile.value),
              color: getTileTextColor(tile.value)
            }}
          >
            {tile.value}
          </div>
        ))}
      </div>

      <div className="game-instructions">
        <p>Use arrow keys or swipe to move tiles</p>
      </div>

      <DevPanel title="2048 Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Score" value={score} />
          <DevInfo label="Best" value={bestScore} />
          <DevInfo label="Won" value={won ? 'Yes' : 'No'} />
          <DevInfo label="Game Over" value={gameOver ? 'Yes' : 'No'} />
          <DevInfo label="Max Tile" value={Math.max(...tiles.map(t => t.value), 0)} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <DevButton onClick={() => {
              const newGrid = grid.map(row => [...row])
              for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                  if (newGrid[r][c] === null) {
                    newGrid[r][c] = 2048
                    setGrid(newGrid)
                    setTiles(createTilesFromGrid(newGrid))
                    setWon(true)
                    return
                  }
                }
              }
            }} variant="success">
              🏆 Spawn 2048
            </DevButton>
            <DevButton onClick={() => {
              const newGrid = grid.map(row => [...row])
              for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                  if (newGrid[r][c] === null) {
                    newGrid[r][c] = 1024
                    setGrid(newGrid)
                    setTiles(createTilesFromGrid(newGrid))
                    return
                  }
                }
              }
            }} variant="warning">
              📎 Spawn 1024
            </DevButton>
            <DevButton onClick={() => {
              setScore(s => s + 1000)
              const newScore = score + 1000
              if (newScore > bestScore) {
                setBestScore(newScore)
                localStorage.setItem('2048-best', String(newScore))
              }
            }} variant="default">
              ➕ Add 1000 Points
            </DevButton>
            <DevButton onClick={() => {
              setGameOver(true)
            }} variant="danger">
              💥 Force Game Over
            </DevButton>
            <DevButton onClick={() => {
              localStorage.removeItem('2048-best')
              setBestScore(0)
            }} variant="danger">
              🗑️ Reset Best Score
            </DevButton>
            <DevButton onClick={startNewGame} variant="default">
              🔄 Reset Game
            </DevButton>
          </div>
        </DevSection>
        <DevSection title="Grid Preview">
          <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4 }}>
            {grid.map((row, i) => (
              <div key={i}>{row.map(v => String(v || '.').padStart(5)).join(' ')}</div>
            ))}
          </div>
        </DevSection>
      </DevPanel>
    </GameLayout>
  )
}
