import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameLayout from '../components/GameLayout';
import Icon from '../components/icons';
import DevPanel, { DevInfo, DevSection } from '../components/DevPanel';
import Confetti from '../components/Confetti';
import StatsModal from '../components/StatsModal';
import ShareButton from '../components/ShareButton';
import { STORAGE_KEYS } from '../constants';
import { recordGame, getStats } from '../utils/stats';
import { audioService } from '../utils/audio';
import {
  Board,
  Tetromino,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PIECE_COLORS,
  createEmptyBoard,
  getRandomTetromino,
  rotatePiece,
  isValidPosition,
  placePiece,
  clearLines,
  getGhostPosition,
  checkGameOver,
  LINE_SCORES,
} from '../utils/tetris';
import '../styles/tetris.css';

type GameState = 'idle' | 'playing' | 'paused' | 'over';

function calculateLevel(linesCleared: number, startLevel: number): number {
  return startLevel + Math.floor(linesCleared / 10);
}

function getDropInterval(level: number): number {
  return Math.max(50, 800 - (level - 1) * 50);
}

export default function TetrisPage() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
  const [holdPiece, setHoldPiece] = useState<Tetromino | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TETRIS_BEST);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [muted, setMuted] = useState(() => audioService.isMuted());
  const [showConfetti] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [, setRotation] = useState(0);

  const dropIntervalRef = useRef<number | null>(null);
  const boardRef = useRef<Board>(createEmptyBoard());
  const pieceRef = useRef<Tetromino | null>(null);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const gameStateRef = useRef<GameState>('idle');
  const nextPieceRef = useRef<Tetromino | null>(null);
  const holdPieceRef = useRef<Tetromino | null>(null);
  const canHoldRef = useRef(true);
  const rotationRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const triggerHaptic = useCallback((ms: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextVal = audioService.toggleMute();
    setMuted(nextVal);
  }, []);

  const clearDropInterval = useCallback(() => {
    if (dropIntervalRef.current !== null) {
      clearInterval(dropIntervalRef.current);
      dropIntervalRef.current = null;
    }
  }, []);

  const spawnPiece = useCallback((): Tetromino => {
    const next = nextPieceRef.current || getRandomTetromino();
    const newNext = getRandomTetromino();
    nextPieceRef.current = newNext;
    setNextPiece(newNext);
    pieceRef.current = next;
    setCurrentPiece(next);
    rotationRef.current = 0;
    setRotation(0);
    canHoldRef.current = true;
    setCanHold(true);
    return next;
  }, []);

  const lockPiece = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece) return;
    const color = PIECE_COLORS[piece.type];
    const newBoard = placePiece(boardRef.current, piece.shape, piece.position, color);
    const { board: clearedBoard, linesCleared: cleared } = clearLines(newBoard);

    if (cleared > 0) {
      const newLines = linesRef.current + cleared;
      linesRef.current = newLines;
      setLinesCleared(newLines);

      const newLevel = calculateLevel(newLines, 1);
      levelRef.current = newLevel;
      setLevel(newLevel);

      const lineScore = LINE_SCORES[Math.min(cleared, 4)] * levelRef.current;
      scoreRef.current += lineScore;
      setScore(scoreRef.current);

      if (scoreRef.current > bestScore) {
        setBestScore(scoreRef.current);
        localStorage.setItem(STORAGE_KEYS.TETRIS_BEST, String(scoreRef.current));
      }

      if (cleared === 4) {
        audioService.playSuccess();
      } else {
        audioService.playMove();
      }
    } else {
      audioService.playClick();
    }

    boardRef.current = clearedBoard;
    setBoard(clearedBoard);

    const next = getRandomTetromino();
    if (checkGameOver(clearedBoard, next.shape, next.position)) {
      setGameState('over');
      gameStateRef.current = 'over';
      clearDropInterval();
      recordGame('tetris', false);
      audioService.playExplosion();
      return;
    }

    spawnPiece();
  }, [bestScore, clearDropInterval, spawnPiece]);

  const movePiece = useCallback((dx: number, dy: number): boolean => {
    const piece = pieceRef.current;
    if (!piece) return false;
    const newPos = { x: piece.position.x + dx, y: piece.position.y + dy };
    if (isValidPosition(boardRef.current, piece.shape, newPos)) {
      pieceRef.current = { ...piece, position: newPos };
      setCurrentPiece({ ...piece, position: newPos });
      if (dy === 0) audioService.playClick();
      return true;
    }
    return false;
  }, []);

  const rotateCW = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || piece.type === 'O') return;
    const rotated = rotatePiece(piece.shape, 1);
    // Wall kick offsets to try
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      const newPos = { x: piece.position.x + kick, y: piece.position.y };
      if (isValidPosition(boardRef.current, rotated, newPos)) {
        pieceRef.current = { shape: rotated, position: newPos, type: piece.type };
        setCurrentPiece({ shape: rotated, position: newPos, type: piece.type });
        rotationRef.current = (rotationRef.current + 1) % 4;
        setRotation(rotationRef.current);
        audioService.playClick();
        return;
      }
    }
  }, []);

  const rotateCCW = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || piece.type === 'O') return;
    const rotated = rotatePiece(piece.shape, -1);
    const kicks = [0, 1, -1, 2, -2];
    for (const kick of kicks) {
      const newPos = { x: piece.position.x + kick, y: piece.position.y };
      if (isValidPosition(boardRef.current, rotated, newPos)) {
        pieceRef.current = { shape: rotated, position: newPos, type: piece.type };
        setCurrentPiece({ shape: rotated, position: newPos, type: piece.type });
        rotationRef.current = (rotationRef.current + 3) % 4;
        setRotation(rotationRef.current);
        audioService.playClick();
        return;
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece) return;
    const ghost = getGhostPosition(boardRef.current, piece.shape, piece.position);
    const dropDistance = ghost.y - piece.position.y;
    scoreRef.current += dropDistance * 2;
    setScore(scoreRef.current);
    pieceRef.current = { ...piece, position: ghost };
    setCurrentPiece({ ...piece, position: ghost });
    triggerHaptic(15);
    lockPiece();
  }, [lockPiece, triggerHaptic]);

  const softDrop = useCallback(() => {
    if (movePiece(0, 1)) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
  }, [movePiece]);

  const holdCurrentPiece = useCallback(() => {
    if (!canHoldRef.current) return;
    const piece = pieceRef.current;
    if (!piece) return;

    canHoldRef.current = false;
    setCanHold(false);

    if (holdPieceRef.current) {
      const held = holdPieceRef.current;
      holdPieceRef.current = {
        type: piece.type,
        shape: getRandomTetromino().shape,
        position: { x: 0, y: 0 },
      };
      // Actually store original shapes
      const newHold = { type: piece.type, shape: piece.shape, position: { x: 0, y: 0 } };
      holdPieceRef.current = newHold;
      setHoldPiece(newHold);

      const fresh = {
        type: held.type,
        shape: held.shape,
        position: { x: Math.floor((BOARD_WIDTH - held.shape[0].length) / 2), y: 0 },
      };
      pieceRef.current = fresh;
      setCurrentPiece(fresh);
      rotationRef.current = 0;
      setRotation(0);
    } else {
      const newHold = { type: piece.type, shape: piece.shape, position: { x: 0, y: 0 } };
      holdPieceRef.current = newHold;
      setHoldPiece(newHold);

      spawnPiece();
    }
    audioService.playClick();
  }, [spawnPiece]);

  const startDropInterval = useCallback(() => {
    clearDropInterval();
    const interval = getDropInterval(levelRef.current);
    dropIntervalRef.current = window.setInterval(() => {
      if (gameStateRef.current !== 'playing') return;
      const piece = pieceRef.current;
      if (!piece) return;
      const moved = isValidPosition(boardRef.current, piece.shape, {
        x: piece.position.x,
        y: piece.position.y + 1,
      });
      if (moved) {
        pieceRef.current = { ...piece, position: { x: piece.position.x, y: piece.position.y + 1 } };
        setCurrentPiece(pieceRef.current);
      } else {
        lockPiece();
      }
    }, interval);
  }, [clearDropInterval, lockPiece]);

  const startNewGame = useCallback(() => {
    clearDropInterval();
    const emptyBoard = createEmptyBoard();
    boardRef.current = emptyBoard;
    setBoard(emptyBoard);
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    setScore(0);
    setLinesCleared(0);
    setLevel(1);
    setHoldPiece(null);
    holdPieceRef.current = null;
    canHoldRef.current = true;
    setCanHold(true);

    const first = getRandomTetromino();
    const next = getRandomTetromino();
    pieceRef.current = first;
    setCurrentPiece(first);
    nextPieceRef.current = next;
    setNextPiece(next);
    rotationRef.current = 0;
    setRotation(0);

    setGameState('playing');
    gameStateRef.current = 'playing';

    setTimeout(() => {
      startDropInterval();
    }, 100);
  }, [clearDropInterval, startDropInterval]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'paused') return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
          gameStateRef.current = 'paused';
          clearDropInterval();
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
          gameStateRef.current = 'playing';
          startDropInterval();
        }
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDrop();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          rotateCW();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          rotateCCW();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          holdCurrentPiece();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    movePiece,
    softDrop,
    rotateCW,
    rotateCCW,
    hardDrop,
    holdCurrentPiece,
    clearDropInterval,
    startDropInterval,
  ]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (gameStateRef.current !== 'playing') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || gameStateRef.current !== 'playing') return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      touchStartRef.current = null;

      // Tap to rotate
      if (absDx < 15 && absDy < 15 && elapsed < 300) {
        rotateCW();
        triggerHaptic(5);
        return;
      }

      // Swipe down = hard drop
      if (dy > 60 && absDy > absDx) {
        hardDrop();
        return;
      }

      // Swipe left/right
      if (absDx > absDy && absDx > 30) {
        movePiece(dx > 0 ? 1 : -1, 0);
      }
      // Swipe up = soft drop repeat
      else if (absDy > absDx && absDy > 30 && dy < 0) {
        softDrop();
      }
    },
    [movePiece, softDrop, rotateCW, hardDrop, triggerHaptic]
  );

  // Restart drop interval when level changes
  useEffect(() => {
    if (gameState === 'playing') {
      startDropInterval();
    }
  }, [level, gameState, startDropInterval]);

  // Pause/resume
  useEffect(() => {
    if (gameState === 'paused') {
      clearDropInterval();
    }
  }, [gameState, clearDropInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearDropInterval();
  }, [clearDropInterval]);

  // Build merged display board
  const displayBoard = (() => {
    const merged = board.map((row) => [...row]);

    // Ghost piece
    if (currentPiece && gameState === 'playing') {
      const ghost = getGhostPosition(board, currentPiece.shape, currentPiece.position);
      const ghostColor = PIECE_COLORS[currentPiece.type] + '40';
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const x = ghost.x + c;
            const y = ghost.y + r;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH && merged[y][x] === null) {
              merged[y][x] = ghostColor;
            }
          }
        }
      }
    }

    // Current piece
    if (currentPiece && (gameState === 'playing' || gameState === 'paused')) {
      const color = PIECE_COLORS[currentPiece.type];
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const x = currentPiece.position.x + c;
            const y = currentPiece.position.y + r;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              merged[y][x] = color;
            }
          }
        }
      }
    }

    return merged;
  })();

  const renderPreview = (piece: Tetromino | null, size: number = 4) => {
    if (!piece) return <div className="tetris-preview-empty" />;
    const previewBoard: (string | null)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null)
    );
    const offsetX = Math.floor((size - piece.shape[0].length) / 2);
    const offsetY = Math.floor((size - piece.shape.length) / 2);
    const color = PIECE_COLORS[piece.type];

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const y = offsetY + r;
          const x = offsetX + c;
          if (y >= 0 && y < size && x >= 0 && x < size) {
            previewBoard[y][x] = color;
          }
        }
      }
    }

    return (
      <div className="tetris-preview-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {previewBoard.flat().map((cell, i) => (
          <div
            key={i}
            className={`tetris-preview-cell ${cell ? 'filled' : ''}`}
            style={cell ? { backgroundColor: cell, boxShadow: `0 0 6px ${cell}80` } : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <GameLayout title="Tetris" color="#8b5cf6" icon={<Icon name="tetris" />}>
      <Confetti active={showConfetti} />

      <div className="tetris-toolbar">
        <div className="toolbar-group">
          <button
            onClick={toggleMute}
            className="btn-icon"
            aria-label={muted ? 'Unmute game' : 'Mute game'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            <Icon name={muted ? 'volumeX' : 'volume'} size={18} />
          </button>
          <button
            onClick={() => setStatsOpen(true)}
            className="btn-icon"
            aria-label="View statistics"
            title="Statistics"
          >
            <span style={{ fontSize: '16px' }}>📊</span>
          </button>
          {gameState === 'playing' || gameState === 'paused' ? (
            <button
              onClick={() => {
                if (gameState === 'playing') {
                  setGameState('paused');
                  gameStateRef.current = 'paused';
                  clearDropInterval();
                } else {
                  setGameState('playing');
                  gameStateRef.current = 'playing';
                  startDropInterval();
                }
              }}
              className="btn-secondary"
            >
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </button>
          ) : null}
          <button onClick={startNewGame} className="btn-primary">
            {gameState === 'idle' ? 'Start Game' : 'New Game'}
          </button>
        </div>
      </div>

      {gameState === 'idle' && (
        <div className="tetris-idle-screen">
          <div className="tetris-idle-icon">🎮</div>
          <h2>Ready to Play?</h2>
          <p>Stack blocks, clear lines, and beat your high score!</p>
          <button onClick={startNewGame} className="btn-primary tetris-start-btn">
            Start Game
          </button>
          {bestScore > 0 && <p className="tetris-idle-best">Best Score: {bestScore}</p>}
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused' || gameState === 'over') && (
        <div className="tetris-container">
          <div className="tetris-side-panel tetris-left-panel">
            <div className="tetris-score-box">
              <div className="tetris-score-label">HOLD</div>
              {renderPreview(holdPiece, 4)}
              {!canHold && <div className="tetris-hold-locked">Locked</div>}
            </div>
          </div>

          <div className="tetris-board-wrapper">
            <div
              className={`tetris-board ${gameState === 'paused' ? 'paused' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {displayBoard.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`tetris-cell ${cell ? 'filled' : ''} ${
                      cell && cell.length > 7 ? 'ghost' : ''
                    }`}
                    style={cell ? { backgroundColor: cell } : undefined}
                  />
                ))
              )}
            </div>
            {gameState === 'paused' && (
              <div className="tetris-pause-overlay">
                <div className="tetris-pause-text">PAUSED</div>
              </div>
            )}
          </div>

          <div className="tetris-side-panel tetris-right-panel">
            <div className="tetris-score-box">
              <div className="tetris-score-label">NEXT</div>
              {renderPreview(nextPiece, 4)}
            </div>
            <div className="tetris-score-box">
              <div className="tetris-score-label">SCORE</div>
              <div className="tetris-score-value">{score}</div>
            </div>
            <div className="tetris-score-box">
              <div className="tetris-score-label">LEVEL</div>
              <div className="tetris-score-value">{level}</div>
            </div>
            <div className="tetris-score-box">
              <div className="tetris-score-label">LINES</div>
              <div className="tetris-score-value">{linesCleared}</div>
            </div>
            <div className="tetris-score-box">
              <div className="tetris-score-label">BEST</div>
              <div className="tetris-score-value">{bestScore}</div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'over' && (
        <div className="game-message lost">
          Game Over!
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button onClick={startNewGame} className="btn-primary">
              Play Again
            </button>
            <ShareButton
              text={`Tetris Score: ${score} | Level: ${level} | Lines: ${linesCleared}`}
            />
          </div>
        </div>
      )}

      <div className="game-instructions">
        <p>
          <span className="desktop-only">
            ← → Move • ↓ Soft Drop • Space Hard Drop • ↑/X Rotate CW • Z Rotate CCW • C Hold • P
            Pause
          </span>
        </p>
      </div>

      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="tetris-mobile-controls mobile-only">
          <div className="tetris-mobile-row">
            <button
              className="tetris-mobile-btn"
              onTouchStart={(e) => {
                e.preventDefault();
                movePiece(-1, 0);
              }}
              aria-label="Move left"
            >
              ◀
            </button>
            <button
              className="tetris-mobile-btn"
              onTouchStart={(e) => {
                e.preventDefault();
                softDrop();
              }}
              aria-label="Soft drop"
            >
              ▼
            </button>
            <button
              className="tetris-mobile-btn"
              onTouchStart={(e) => {
                e.preventDefault();
                movePiece(1, 0);
              }}
              aria-label="Move right"
            >
              ▶
            </button>
          </div>
          <div className="tetris-mobile-row">
            <button
              className={`tetris-mobile-btn tetris-mobile-hold ${!canHold ? 'disabled' : ''}`}
              onTouchStart={(e) => {
                e.preventDefault();
                holdCurrentPiece();
              }}
              disabled={!canHold}
              aria-label="Hold piece"
            >
              Hold
            </button>
            <button
              className="tetris-mobile-btn tetris-mobile-rotate"
              onTouchStart={(e) => {
                e.preventDefault();
                rotateCW();
                triggerHaptic(5);
              }}
              aria-label="Rotate"
            >
              ↻
            </button>
            <button
              className="tetris-mobile-btn tetris-mobile-drop"
              onTouchStart={(e) => {
                e.preventDefault();
                hardDrop();
              }}
              aria-label="Hard drop"
            >
              ⤓
            </button>
          </div>
        </div>
      )}

      <p className="tetris-mobile-note mobile-only">
        Best played with a keyboard for precise control
      </p>

      <DevPanel title="Tetris Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Score" value={score} />
          <DevInfo label="Level" value={level} />
          <DevInfo label="Lines" value={linesCleared} />
          <DevInfo label="State" value={gameState} />
          <DevInfo label="Best" value={bestScore} />
          <DevInfo label="Drop Interval" value={`${getDropInterval(level)}ms`} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <button
              onClick={() => {
                if (gameState === 'playing' || gameState === 'paused') {
                  setScore((s) => {
                    const newScore = s + 1000;
                    scoreRef.current = newScore;
                    if (newScore > bestScore) {
                      setBestScore(newScore);
                      localStorage.setItem(STORAGE_KEYS.TETRIS_BEST, String(newScore));
                    }
                    return newScore;
                  });
                }
              }}
              className="btn-secondary"
            >
              Add 1000 Points
            </button>
            <button onClick={startNewGame} className="btn-secondary">
              Reset Game
            </button>
          </div>
        </DevSection>
      </DevPanel>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        gameName="Tetris"
        stats={getStats('tetris')}
      />
    </GameLayout>
  );
}
