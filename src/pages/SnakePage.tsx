import React, { useCallback, useEffect, useState, useRef } from 'react';
import GameLayout from '../components/GameLayout';
import Icon from '../components/icons';
import DevPanel, { DevButton, DevInfo, DevSection } from '../components/DevPanel';
import Confetti from '../components/Confetti';
import StatsModal from '../components/StatsModal';
import ShareButton from '../components/ShareButton';
import { STORAGE_KEYS } from '../constants';
import { recordGame, getStats } from '../utils/stats';
import { audioService } from '../utils/audio';
import {
  Point,
  Direction,
  createInitialSnake,
  generateFood,
  moveSnake,
  getSpeed,
} from '../utils/snake';

const GRID_ROWS = 20;
const GRID_COLS = 20;

export default function SnakePage() {
  const [snake, setSnake] = useState<Point[]>(() => createInitialSnake(GRID_ROWS, GRID_COLS));
  const [food, setFood] = useState<Point>(() =>
    generateFood(createInitialSnake(GRID_ROWS, GRID_COLS), GRID_ROWS, GRID_COLS)
  );
  const [, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SNAKE_BEST);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(() => audioService.isMuted());
  const [showConfetti, setShowConfetti] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const directionRef = useRef<Direction>('RIGHT');
  const lastMoveTime = useRef(0);
  const gameLoopRef = useRef<number | null>(null);

  const toggleMute = () => {
    const nextVal = audioService.toggleMute();
    setMuted(nextVal);
  };

  const startNewGame = useCallback(() => {
    const initial = createInitialSnake(GRID_ROWS, GRID_COLS);
    setSnake(initial);
    setFood(generateFood(initial, GRID_ROWS, GRID_COLS));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setWon(false);
    setPaused(false);
    setShowConfetti(false);
  }, []);

  const triggerHaptic = (ms: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  // Game loop
  useEffect(() => {
    if (gameOver || won || paused) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const speed = getSpeed(score);

    function gameLoop(timestamp: number) {
      if (timestamp - lastMoveTime.current >= speed) {
        lastMoveTime.current = timestamp;

        const result = moveSnake(snake, directionRef.current, food, GRID_ROWS, GRID_COLS);

        if (result.gameOver) {
          setGameOver(true);
          recordGame('snake', false);
          audioService.playExplosion();
          return;
        }

        setSnake(result.snake);

        if (result.ate) {
          const newScore = score + 1;
          setScore(newScore);
          audioService.playSuccess();
          triggerHaptic(12);

          if (newScore > bestScore) {
            setBestScore(newScore);
            localStorage.setItem(STORAGE_KEYS.SNAKE_BEST, String(newScore));
          }

          const newFood = generateFood(result.snake, GRID_ROWS, GRID_COLS);
          setFood(newFood);

          if (result.snake.length >= GRID_ROWS * GRID_COLS) {
            setWon(true);
            setShowConfetti(true);
            recordGame('snake', true);
            audioService.playWin();
          }
        } else {
          audioService.playClick();
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [snake, food, score, bestScore, gameOver, won, paused]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (!gameOver && !won) {
          setPaused((p) => !p);
        }
        return;
      }

      if (gameOver || won || paused) return;

      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      };

      const newDir = keyMap[e.key];
      if (!newDir) return;

      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };

      if (opposites[newDir] !== directionRef.current) {
        directionRef.current = newDir;
        setDirection(newDir);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, won, paused]);

  // Touch controls
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

    if (gameOver || won || paused) return;

    let newDir: Direction;
    if (absDx > absDy) {
      newDir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      newDir = dy > 0 ? 'DOWN' : 'UP';
    }

    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };

    if (opposites[newDir] !== directionRef.current) {
      directionRef.current = newDir;
      setDirection(newDir);
    }

    setTouchStart(null);
  }

  const speed = getSpeed(score);
  const speedLevel = Math.floor((150 - speed) / 10) + 1;

  return (
    <GameLayout title="Snake" color="#06b6d4" icon={<Icon name="snake" />}>
      <Confetti active={showConfetti} />

      <div className="snake-header">
        <div className="snake-scores">
          <div className="snake-score-box">
            <div className="snake-score-label">SCORE</div>
            <div className="snake-score-value">{score}</div>
          </div>
          <div className="snake-score-box">
            <div className="snake-score-label">BEST</div>
            <div className="snake-score-value">{bestScore}</div>
          </div>
          <div className="snake-score-box">
            <div className="snake-score-label">SPEED</div>
            <div className="snake-score-value">{speedLevel}</div>
            <div className="snake-speed-indicator">{speed}ms</div>
          </div>
        </div>
        <div className="snake-controls">
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
          <button onClick={startNewGame} className="btn-primary">
            New Game
          </button>
          {!gameOver && !won && (
            <button
              onClick={() => setPaused((p) => !p)}
              className="btn-secondary"
              title={paused ? 'Resume' : 'Pause'}
            >
              {paused ? '▶' : '⏸'}
            </button>
          )}
        </div>
      </div>

      {(gameOver || won) && (
        <div className={`game-message ${gameOver ? 'lost' : 'won'}`}>
          {gameOver ? 'Game Over!' : '🎉 You Win!'}
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
              Try Again
            </button>
            <ShareButton text={`Snake Score: ${score} | Best: ${bestScore}`} />
          </div>
        </div>
      )}

      <div className="snake-grid-container">
        <div
          className="snake-grid-wrapper"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="snake-grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, var(--snake-cell-size, 20px))`,
              gridTemplateRows: `repeat(${GRID_ROWS}, var(--snake-cell-size, 20px))`,
            }}
          >
            {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
              const x = i % GRID_COLS;
              const y = Math.floor(i / GRID_COLS);
              const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
              const isSnakeBody = !isSnakeHead && snake.some((s) => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;

              let cellClass = 'snake-cell';
              if (isSnakeHead) cellClass += ' snake-head';
              else if (isSnakeBody) {
                const idx = snake.findIndex((s) => s.x === x && s.y === y);
                cellClass += idx === snake.length - 1 ? ' snake-tail' : ' snake-body';
              }
              if (isFood) cellClass += ' snake-food';

              return <div key={i} className={cellClass} />;
            })}
          </div>
          {paused && (
            <div className="snake-paused-overlay">
              <div className="snake-paused-text">PAUSED</div>
            </div>
          )}
        </div>
      </div>

      <div className="game-instructions">
        <p>Arrow keys or WASD to move • Space to pause • Swipe on mobile</p>
      </div>

      <DevPanel title="Snake Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Score" value={score} />
          <DevInfo label="Best" value={bestScore} />
          <DevInfo label="Snake Length" value={snake.length} />
          <DevInfo label="Speed Level" value={speedLevel} />
          <DevInfo label="Game Over" value={gameOver ? 'Yes' : 'No'} />
          <DevInfo label="Won" value={won ? 'Yes' : 'No'} />
          <DevInfo label="Paused" value={paused ? 'Yes' : 'No'} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <DevButton
              onClick={() => {
                setScore((s) => {
                  const newScore = s + 5;
                  if (newScore > bestScore) {
                    setBestScore(newScore);
                    localStorage.setItem(STORAGE_KEYS.SNAKE_BEST, String(newScore));
                  }
                  return newScore;
                });
              }}
              variant="success"
            >
              ➕ Add 5 Points
            </DevButton>
            <DevButton
              onClick={() => {
                setGameOver(true);
              }}
              variant="danger"
            >
              💥 Force Game Over
            </DevButton>
            <DevButton
              onClick={() => {
                localStorage.removeItem(STORAGE_KEYS.SNAKE_BEST);
                setBestScore(0);
              }}
              variant="danger"
            >
              🗑️ Reset Best Score
            </DevButton>
            <DevButton onClick={startNewGame} variant="default">
              🔄 Reset Game
            </DevButton>
          </div>
        </DevSection>
        <DevSection title="Snake Preview">
          <div style={{ fontFamily: 'monospace', fontSize: 8, lineHeight: 1 }}>
            {Array.from({ length: GRID_ROWS }).map((_, row) => (
              <div key={row}>
                {Array.from({ length: GRID_COLS }).map((_, col) => {
                  const isHead = snake[0]?.x === col && snake[0]?.y === row;
                  const isBody = snake.some((s) => s.x === col && s.y === row);
                  const isFood = food.x === col && food.y === row;
                  if (isHead) return <span key={col}>H</span>;
                  if (isBody) return <span key={col}>B</span>;
                  if (isFood) return <span key={col}>F</span>;
                  return <span key={col}>.</span>;
                })}
              </div>
            ))}
          </div>
        </DevSection>
      </DevPanel>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        gameName="Snake"
        stats={getStats('snake')}
      />
    </GameLayout>
  );
}
