import React from 'react';
import GameLayout from '../components/GameLayout';
import Icon from '../components/icons';
import Dropdown from '../components/Dropdown';
import DevPanel, { DevButton, DevInfo, DevSection } from '../components/DevPanel';
import Confetti from '../components/Confetti';
import StatsModal from '../components/StatsModal';
import ShareButton from '../components/ShareButton';
import { MINESWEEPER_MAX_ROWS, MINESWEEPER_MAX_COLS } from '../constants';
import { getStats } from '../utils/stats';
import { countFlags } from '../utils/minesweeper';
import useMinesweeper from '../hooks/useMinesweeper';

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

type MinesweeperGridProps = {
  grid: ReturnType<typeof useMinesweeper>['displayGrid'];
  rows: number;
  cols: number;
  showMines: boolean;
  gameState: 'waiting' | 'playing' | 'won' | 'lost';
  onCellClick: (row: number, col: number, isMiddleClick?: boolean) => void;
  onToggleFlag: (row: number, col: number) => void;
};

const MinesweeperGrid = React.memo(function MinesweeperGrid({
  grid,
  rows,
  cols,
  showMines,
  gameState,
  onCellClick,
  onToggleFlag,
}: MinesweeperGridProps) {
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="minesweeper-grid-wrap">
      <div className="minesweeper-hint mobile-only">Grid scales to fit • Long-press to flag</div>
      <div
        className="minesweeper-grid"
        onContextMenu={(e) => e.preventDefault()}
        style={
          {
            gridTemplateColumns: `repeat(${cols}, var(--mine-cell-size))`,
            gridTemplateRows: `repeat(${rows}, var(--mine-cell-size))`,
            '--grid-cols': cols,
          } as React.CSSProperties
        }
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            let pointerTimer: number | null = null;

            const onAux = (e: React.MouseEvent) => {
              e.preventDefault();
              if (e.button === 1) {
                onCellClick(r, c, true);
              } else if (e.button === 2) {
                onToggleFlag(r, c);
              }
            };

            const onPointerDown = (e: React.PointerEvent) => {
              if (e.pointerType === 'touch') {
                touchStartRef.current = { x: e.clientX, y: e.clientY };
                pointerTimer = window.setTimeout(() => {
                  if (gameState === 'playing' && !grid[r][c].isRevealed) {
                    onToggleFlag(r, c);
                  }
                  pointerTimer = null;
                }, 500);
              }
            };

            const onPointerUp = () => {
              if (pointerTimer) {
                clearTimeout(pointerTimer as number);
                pointerTimer = null;
                onCellClick(r, c);
              }
            };

            const onPointerMove = (e: React.PointerEvent) => {
              if (pointerTimer && touchStartRef.current) {
                const dx = e.clientX - touchStartRef.current.x;
                const dy = e.clientY - touchStartRef.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 10) {
                  clearTimeout(pointerTimer as number);
                  pointerTimer = null;
                }
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
                onClick={() => onCellClick(r, c)}
                onAuxClick={onAux}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onToggleFlag(r, c);
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
                    <span className={NUMBER_CLASSES[cell.adjacentMines]}>{cell.adjacentMines}</span>
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
  );
});

export default function MinesweeperPage() {
  const {
    difficulty,
    customConfig,
    grid,
    gameState,
    time,
    showMines,
    flagMode,
    muted,
    showConfetti,
    statsOpen,
    config,
    minesRemaining,
    displayGrid,
    setDifficulty,
    setShowMines,
    setFlagMode,
    setStatsOpen,
    startNewGame,
    handleCellClick,
    handleCustomConfigChange,
    toggleFlagSafe,
    toggleMute,
    forceWin,
    forceLose,
    generateGridNow,
  } = useMinesweeper();

  return (
    <GameLayout title="Minesweeper" color="#f43f5e" icon={<Icon name="minesweeper" />}>
      <Confetti active={showConfetti} />
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
            onChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard' | 'custom')}
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
        </div>

        {(gameState === 'won' || gameState === 'lost') && (
          <div className={`game-message ${gameState}`}>
            {gameState === 'won' ? '🎉 You Win!' : '💥 Game Over!'}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={startNewGame} className="btn-primary">
                Play Again
              </button>
              <ShareButton
                text={`Minesweeper ${
                  difficulty === 'custom' ? `${customConfig.rows}x${customConfig.cols}` : difficulty
                } ${gameState === 'won' ? '✅' : '💥'} ${formatTime(time)}`}
              />
            </div>
          </div>
        )}

        <MinesweeperGrid
          grid={displayGrid}
          rows={config.rows}
          cols={config.cols}
          showMines={showMines}
          gameState={gameState}
          onCellClick={handleCellClick}
          onToggleFlag={toggleFlagSafe}
        />
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
            <DevButton onClick={forceWin} variant="success">
              🏆 Force Win
            </DevButton>
            <DevButton onClick={forceLose} variant="danger">
              💥 Force Lose
            </DevButton>
            <DevButton onClick={generateGridNow} variant="default">
              🎲 Generate Grid Now
            </DevButton>
            <DevButton onClick={startNewGame} variant="default">
              🔄 Reset Game
            </DevButton>
          </div>
        </DevSection>
      </DevPanel>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        gameName="Minesweeper"
        stats={getStats('minesweeper')}
      />
    </GameLayout>
  );
}
