import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameLayout from '../components/GameLayout';
import Icon from '../components/icons';
import Dropdown from '../components/Dropdown';
import DevPanel, { DevButton, DevInfo, DevSection } from '../components/DevPanel';
import Confetti from '../components/Confetti';
import StatsModal from '../components/StatsModal';
import ShareButton from '../components/ShareButton';
import { STORAGE_KEYS } from '../constants';
import { recordGame, getStats } from '../utils/stats';
import { audioService } from '../utils/audio';
import {
  CellState,
  Board,
  Puzzle,
  generatePuzzle,
  createEmptyBoard,
  checkWin,
  getHint,
} from '../utils/nonogram';
import '../styles/nonogram.css';

type SizeOption = '5' | '10' | '15';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

function NonogramBoard({
  puzzle,
  board,
  gameState,
  hintCell,
  onCellClick,
  onToggleMark,
}: {
  puzzle: Puzzle;
  board: Board;
  gameState: 'waiting' | 'playing' | 'won' | 'lost';
  hintCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  onToggleMark: (row: number, col: number) => void;
}) {
  const { size, rowClues, colClues } = puzzle;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const maxRowClueGroups = useMemo(() => Math.max(...rowClues.map((c) => c.length)), [rowClues]);
  const maxColClueGroups = useMemo(() => Math.max(...colClues.map((c) => c.length)), [colClues]);

  const cells: React.ReactNode[] = [];

  // Row 0..maxColClueGroups-1: column clue rows
  for (let clueRow = 0; clueRow < maxColClueGroups; clueRow++) {
    // Row clue header cells (left side)
    for (let rc = 0; rc < maxRowClueGroups; rc++) {
      cells.push(<div key={`corner-${clueRow}-${rc}`} className="nonogram-corner" />);
    }
    // Column clue cells
    for (let c = 0; c < size; c++) {
      const clues = colClues[c];
      const idx = clues.length - 1 - clueRow;
      const value = idx >= 0 ? clues[idx] : null;
      const sepClass = (c + 1) % 5 === 0 && c < size - 1 ? ' sep-right' : '';
      cells.push(
        <div
          key={`cc-${clueRow}-${c}`}
          className={`nonogram-col-clue${sepClass}`}
          style={{ gridColumn: maxRowClueGroups + c + 1, gridRow: clueRow + 1 }}
        >
          {value}
        </div>
      );
    }
  }

  // Puzzle rows
  for (let r = 0; r < size; r++) {
    // Row clues
    const clues = rowClues[r];
    for (let gc = 0; gc < maxRowClueGroups; gc++) {
      const idx = clues.length - 1 - gc;
      const value = idx >= 0 ? clues[idx] : null;
      const sepClass = (r + 1) % 5 === 0 && r < size - 1 ? ' sep-bottom' : '';
      cells.push(
        <div
          key={`rc-${r}-${gc}`}
          className={`nonogram-row-clue${sepClass}`}
          style={{ gridColumn: maxRowClueGroups - gc, gridRow: maxColClueGroups + r + 1 }}
        >
          {value}
        </div>
      );
    }

    // Puzzle cells
    for (let c = 0; c < size; c++) {
      const state = board[r][c];
      const isHint = hintCell && hintCell.row === r && hintCell.col === c;
      const sepRight = (c + 1) % 5 === 0 && c < size - 1 ? ' sep-right' : '';
      const sepBottom = (r + 1) % 5 === 0 && r < size - 1 ? ' sep-bottom' : '';
      const classes = [
        'nonogram-cell',
        state === 'filled' ? 'filled' : '',
        state === 'marked' ? 'marked' : '',
        isHint ? 'correct' : '',
        sepRight,
        sepBottom,
      ]
        .filter(Boolean)
        .join(' ');

      let pointerTimer: number | null = null;

      const onPointerDown = (e: React.PointerEvent) => {
        if (e.pointerType === 'touch') {
          touchStartRef.current = { x: e.clientX, y: e.clientY };
          pointerTimer = window.setTimeout(() => {
            if (gameState === 'playing') {
              onToggleMark(r, c);
              triggerHaptic(10);
            }
            pointerTimer = null;
          }, 500);
        }
      };

      const onPointerUp = () => {
        if (pointerTimer) {
          clearTimeout(pointerTimer as number);
          pointerTimer = null;
          // Tap - check for double tap
          const now = Date.now();
          if (now - lastTapRef.current < 300) {
            onToggleMark(r, c);
            lastTapRef.current = 0;
          } else {
            onCellClick(r, c);
            lastTapRef.current = now;
          }
        }
      };

      const onPointerMove = (e: React.PointerEvent) => {
        if (pointerTimer && touchStartRef.current) {
          const dx = e.clientX - touchStartRef.current.x;
          const dy = e.clientY - touchStartRef.current.y;
          if (Math.sqrt(dx * dx + dy * dy) > 10) {
            clearTimeout(pointerTimer as number);
            pointerTimer = null;
          }
        }
      };

      cells.push(
        <button
          key={`cell-${r}-${c}`}
          className={classes}
          style={{ gridColumn: maxRowClueGroups + c + 1, gridRow: maxColClueGroups + r + 1 }}
          onClick={() => onCellClick(r, c)}
          onContextMenu={(e) => {
            e.preventDefault();
            onToggleMark(r, c);
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerMove={onPointerMove}
          disabled={gameState === 'won' || gameState === 'lost'}
        >
          {state === 'filled' ? '' : state === 'marked' ? '✕' : ''}
        </button>
      );
    }
  }

  return (
    <div className="nonogram-board-wrap">
      <div
        className="nonogram-board"
        onContextMenu={(e) => e.preventDefault()}
        style={
          {
            gridTemplateColumns: `repeat(${maxRowClueGroups}, auto) repeat(${size}, var(--cell-size))`,
            gridTemplateRows: `repeat(${maxColClueGroups}, auto) repeat(${size}, var(--cell-size))`,
          } as React.CSSProperties
        }
      >
        {cells}
      </div>
    </div>
  );
}

function triggerHaptic(ms: number) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}

export default function NonogramPage() {
  const [sizeOption, setSizeOption] = useState<SizeOption>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NONOGRAM_SIZE);
    return (saved as SizeOption) || '5';
  });
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(parseInt(sizeOption)));
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintCell, setHintCell] = useState<{ row: number; col: number } | null>(null);
  const [muted, setMuted] = useState(() => audioService.isMuted());
  const [showConfetti, setShowConfetti] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [mode, setMode] = useState<'fill' | 'mark'>('fill');

  const size = parseInt(sizeOption);

  const toggleMute = useCallback(() => {
    const nextVal = audioService.toggleMute();
    setMuted(nextVal);
  }, []);

  const startNewGame = useCallback(() => {
    const newPuzzle = generatePuzzle(size);
    setPuzzle(newPuzzle);
    setBoard(createEmptyBoard(size));
    setGameState('waiting');
    setTime(0);
    setTimerRunning(false);
    setHintsUsed(0);
    setHintCell(null);
    setShowConfetti(false);
  }, [size]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NONOGRAM_SIZE, sizeOption);
    startNewGame();
  }, [sizeOption, startNewGame]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState === 'won' || gameState === 'lost' || !puzzle) return;

      if (gameState === 'waiting') {
        setGameState('playing');
        setTimerRunning(true);
      }

      const newBoard = board.map((r) => [...r]);
      const current = newBoard[row][col];
      if (mode === 'fill') {
        if (current === 'filled') {
          newBoard[row][col] = 'empty';
        } else if (current === 'empty') {
          newBoard[row][col] = 'filled';
        }
      } else {
        if (current === 'marked') {
          newBoard[row][col] = 'empty';
        } else if (current === 'empty') {
          newBoard[row][col] = 'marked';
        }
      }
      setBoard(newBoard);
      setHintCell(null);
      triggerHaptic(8);
      audioService.playMove();

      if (checkWin(newBoard, puzzle.solution)) {
        setGameState('won');
        setTimerRunning(false);
        setShowConfetti(true);
        recordGame('nonogram', true);
        audioService.playWin();
      }
    },
    [board, gameState, puzzle, mode]
  );

  const handleToggleMark = useCallback(
    (row: number, col: number) => {
      if (gameState === 'won' || gameState === 'lost') return;

      if (gameState === 'waiting') {
        setGameState('playing');
        setTimerRunning(true);
      }

      const newBoard = board.map((r) => [...r]);
      const current = newBoard[row][col];
      if (current === 'marked') {
        newBoard[row][col] = 'empty';
      } else if (current === 'empty') {
        newBoard[row][col] = 'marked';
      }
      setBoard(newBoard);
      audioService.playClick();
    },
    [board, gameState]
  );

  const handleHint = useCallback(() => {
    if (!puzzle || gameState === 'won' || gameState === 'lost') return;
    if (gameState === 'waiting') {
      setGameState('playing');
      setTimerRunning(true);
    }
    const hint = getHint(board, puzzle.solution);
    if (hint) {
      setHintCell(hint);
      setHintsUsed((h) => h + 1);
      audioService.playClick();
    }
  }, [board, puzzle, gameState]);

  const filledCount = useMemo(
    () => board.reduce((sum, row) => sum + row.filter((c) => c === 'filled').length, 0),
    [board]
  );
  const totalFilled = puzzle
    ? puzzle.solution.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
    : 0;

  return (
    <GameLayout title="Nonogram" color="#ec4899" icon={<Icon name="nonogram" />}>
      <Confetti active={showConfetti} />
      <div className="game-toolbar">
        <div className="toolbar-group">
          <Dropdown
            ariaLabel="Select grid size"
            value={sizeOption}
            options={[
              { value: '5', label: '5×5' },
              { value: '10', label: '10×10' },
              { value: '15', label: '15×15' },
            ]}
            onChange={(v) => setSizeOption(v as SizeOption)}
          />
        </div>
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
          <button onClick={startNewGame} className="btn-primary">
            New Game
          </button>
        </div>
      </div>

      <div className="nonogram-container">
        <div className="nonogram-stats">
          <div className="stat" title="Time elapsed">
            <span className="stat-icon">⏱️</span>
            <div className="stat-display">
              <span className="stat-ghost">88:88:88</span>
              <span className="stat-value">{formatTime(time)}</span>
            </div>
            <span className="stat-label mobile-only">Time</span>
          </div>
          <div className="stat" title="Cells filled">
            <span className="stat-icon">🎨</span>
            <div className="stat-display">
              <span className="stat-ghost">88/88</span>
              <span className="stat-value">
                {filledCount}/{totalFilled}
              </span>
            </div>
            <span className="stat-label mobile-only">Filled</span>
          </div>
          <div className="stat" title="Hints used">
            <span className="stat-icon">💡</span>
            <div className="stat-display">
              <span className="stat-ghost">88</span>
              <span className="stat-value">{hintsUsed.toString().padStart(2, '0')}</span>
            </div>
            <span className="stat-label mobile-only">Hints</span>
          </div>
        </div>

        <div className="nonogram-mode-toggle mobile-only">
          <button
            className={`nonogram-mode-btn ${mode === 'fill' ? 'active' : ''}`}
            onClick={() => setMode('fill')}
            aria-label="Fill mode"
          >
            🎨 Fill
          </button>
          <button
            className={`nonogram-mode-btn ${mode === 'mark' ? 'active' : ''}`}
            onClick={() => setMode('mark')}
            aria-label="Mark mode"
          >
            ✕ Mark
          </button>
        </div>

        {(gameState === 'won' || gameState === 'lost') && (
          <div className={`game-message ${gameState}`}>
            {gameState === 'won' ? '🎉 Puzzle Complete!' : '💀 Game Over!'}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={startNewGame} className="btn-primary">
                Play Again
              </button>
              <ShareButton
                text={`Nonogram ${sizeOption}×${sizeOption} ${
                  gameState === 'won' ? '✅' : '❌'
                } ${formatTime(time)} Hints: ${hintsUsed}`}
              />
            </div>
          </div>
        )}

        {puzzle && (
          <NonogramBoard
            puzzle={puzzle}
            board={board}
            gameState={gameState}
            hintCell={hintCell}
            onCellClick={handleCellClick}
            onToggleMark={handleToggleMark}
          />
        )}

        <div style={{ marginTop: '12px' }}>
          <button
            onClick={handleHint}
            className="btn-secondary"
            disabled={gameState === 'won' || gameState === 'lost'}
          >
            💡 Hint
          </button>
        </div>
      </div>

      <div className="game-instructions">
        <p>
          <span className="desktop-only">
            Left-click to fill • Right-click to mark ✕ • Use clues to deduce the pattern
          </span>
          <span className="mobile-only">Tap to fill • Double-tap or long-press to mark ✕</span>
        </p>
      </div>

      <DevPanel title="Nonogram Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Size" value={`${sizeOption}×${sizeOption}`} />
          <DevInfo label="State" value={gameState} />
          <DevInfo label="Time" value={`${time}s`} />
          <DevInfo label="Hints Used" value={hintsUsed} />
          <DevInfo label="Filled" value={`${filledCount}/${totalFilled}`} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <DevButton
              onClick={() => {
                if (puzzle) {
                  setBoard(
                    puzzle.solution.map((row) =>
                      row.map((cell): CellState => (cell ? 'filled' : 'empty'))
                    )
                  );
                  setGameState('won');
                  setTimerRunning(false);
                  setShowConfetti(true);
                  recordGame('nonogram', true);
                  audioService.playWin();
                }
              }}
              variant="success"
            >
              🏆 Force Win
            </DevButton>
            <DevButton onClick={startNewGame} variant="default">
              🔄 New Puzzle
            </DevButton>
          </div>
        </DevSection>
      </DevPanel>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        gameName="Nonogram"
        stats={getStats('nonogram')}
      />
    </GameLayout>
  );
}
