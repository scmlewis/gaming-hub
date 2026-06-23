import React from 'react';
import GameLayout from '../components/GameLayout';
import Icon from '../components/icons';
import DevPanel, { DevButton, DevInfo, DevSection } from '../components/DevPanel';
import Confetti from '../components/Confetti';
import StatsModal from '../components/StatsModal';
import ShareButton from '../components/ShareButton';
import { getStats } from '../utils/stats';
import { TILE_THEMES } from '../utils/themes2048';
import { getTileColor, getTileTextColor } from '../utils/game2048';
import useGame2048 from '../hooks/useGame2048';

function createTilesFromGrid(
  grid: ReturnType<typeof useGame2048>['grid']
): Array<{
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerging?: boolean;
}> {
  let nextTileId = 1;
  const tiles: Array<{
    id: number;
    value: number;
    row: number;
    col: number;
    isNew?: boolean;
    isMerging?: boolean;
  }> = [];
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

export default function Game2048Page() {
  const {
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
    setGrid,
    setTiles,
    setScore,
    setBestScore,
    setGameOver,
    setWon,
    setKeepPlaying,
    setTileTheme,
    setHint,
    setSettingsOpen,
    setStatsOpen,
    toggleMute,
    startNewGame,
    handleUndo,
    handleGetHint,
    handleTouchStart,
    handleTouchEnd,
    getTileFontClass,
    getAccentColor,
    isAnimating,
  } = useGame2048();

  return (
    <GameLayout title="2048" color={getAccentColor(tileTheme)} icon={<Icon name="game2048" />}>
      <Confetti active={showConfetti} />

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <button
            onClick={handleUndo}
            className="btn-secondary game-2048-undo-btn"
            disabled={moveHistory.length === 0 || isAnimating.current}
            title="Undo last move"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleGetHint}
            className="btn-secondary game-2048-hint-btn"
            disabled={gameOver || isAnimating.current}
            title="Get hint for best move"
          >
            💡 Hint
          </button>
          <button onClick={startNewGame} className="btn-primary game-2048-new-btn">
            New Game
          </button>
          <button onClick={() => setSettingsOpen(true)} className="btn-icon" aria-label="Settings">
            <Icon name="settings" size={18} />
          </button>
        </div>
      </div>

      {hint && !gameOver && (
        <div className="game-hint">
          Move <strong>{hint.direction.toUpperCase()}</strong>
          <span className="hint-arrow">
            {hint.direction === 'up' && '↑'}
            {hint.direction === 'down' && '↓'}
            {hint.direction === 'left' && '←'}
            {hint.direction === 'right' && '→'}
          </span>
          — {hint.reason}
          <button className="hint-close" onClick={() => setHint(null)}>
            ✕
          </button>
        </div>
      )}

      {(gameOver || (won && !keepPlaying)) && (
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
            {won && !keepPlaying && (
              <button onClick={() => setKeepPlaying(true)} className="btn-secondary">
                Keep Playing
              </button>
            )}
            <ShareButton text={`2048 Score: ${score} | Best: ${bestScore}`} />
          </div>
        </div>
      )}

      <div className="game-2048-grid" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={`cell-${i}`} className="tile-2048-cell" />
        ))}

        {tiles.map((tile) => (
          <div
            key={tile.id}
            className={`tile-2048${tile.isNew ? ' tile-new' : ''}${
              tile.isMerging ? ' tile-merge' : ''
            } ${getTileFontClass(tile.value)}`}
            style={{
              backgroundColor: getTileColor(tile.value, tileTheme),
              color: getTileTextColor(tile.value, tileTheme),
              top: `calc(var(--2048-pad) + ${tile.row} * (var(--2048-cell) + var(--2048-gap)))`,
              left: `calc(var(--2048-pad) + ${tile.col} * (var(--2048-cell) + var(--2048-gap)))`,
            }}
          >
            {tile.value}
          </div>
        ))}
      </div>

      {settingsOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsOpen(false);
          }}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, opacity: 0.8 }}>Accent Color</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(TILE_THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      className={`btn-secondary ${tileTheme === key ? 'selected' : ''}`}
                      onClick={() => setTileTheme(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        className="theme-swatch"
                        style={{
                          background: theme.colors[2048],
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          display: 'inline-block',
                        }}
                        aria-hidden
                      ></span>
                      <span>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, opacity: 0.8 }}>Actions</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      handleUndo();
                      setSettingsOpen(false);
                    }}
                    className="btn-secondary"
                    disabled={moveHistory.length === 0 || isAnimating.current}
                    title="Undo last move"
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={() => {
                      handleGetHint();
                      setSettingsOpen(false);
                    }}
                    className="btn-secondary"
                    disabled={gameOver || isAnimating.current}
                    title="Get hint for best move"
                  >
                    💡 Hint
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(false);
                }}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-instructions">
        <p>Use arrow keys or swipe to move tiles • {moveHistory.length} moves</p>
      </div>

      <DevPanel title="2048 Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Score" value={score} />
          <DevInfo label="Best" value={bestScore} />
          <DevInfo label="Won" value={won ? 'Yes' : 'No'} />
          <DevInfo label="Game Over" value={gameOver ? 'Yes' : 'No'} />
          <DevInfo label="Max Tile" value={Math.max(...tiles.map((t) => t.value), 0)} />
          <DevInfo label="Theme" value={tileTheme} />
          <DevInfo label="Move History" value={moveHistory.length} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <DevButton
              onClick={() => {
                const newGrid = grid.map((row) => [...row]);
                for (let r = 0; r < 4; r++) {
                  for (let c = 0; c < 4; c++) {
                    if (newGrid[r][c] === null) {
                      newGrid[r][c] = 2048;
                      setGrid(newGrid);
                      setTiles(createTilesFromGrid(newGrid));
                      setWon(true);
                      return;
                    }
                  }
                }
              }}
              variant="success"
            >
              🏆 Spawn 2048
            </DevButton>
            <DevButton
              onClick={() => {
                const newGrid = grid.map((row) => [...row]);
                for (let r = 0; r < 4; r++) {
                  for (let c = 0; c < 4; c++) {
                    if (newGrid[r][c] === null) {
                      newGrid[r][c] = 1024;
                      setGrid(newGrid);
                      setTiles(createTilesFromGrid(newGrid));
                      return;
                    }
                  }
                }
              }}
              variant="warning"
            >
              📎 Spawn 1024
            </DevButton>
            <DevButton
              onClick={() => {
                setScore((s) => {
                  const newScore = s + 1000;
                  if (newScore > bestScore) {
                    setBestScore(newScore);
                    localStorage.setItem('2048-best', String(newScore));
                  }
                  return newScore;
                });
              }}
              variant="default"
            >
              ➕ Add 1000 Points
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
                localStorage.removeItem('2048-best');
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
        <DevSection title="Grid Preview">
          <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4 }}>
            {grid.map((row, i) => (
              <div key={i}>{row.map((v) => String(v || '.').padStart(5)).join(' ')}</div>
            ))}
          </div>
        </DevSection>
      </DevPanel>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        gameName="2048"
        stats={getStats('game2048')}
      />
    </GameLayout>
  );
}
