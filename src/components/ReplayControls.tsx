import React from 'react'

export interface MoveHistory {
  grid: (number | null)[][]
  tiles: any[]
  score: number
  direction: 'up' | 'down' | 'left' | 'right'
  timestamp: number
}

interface ReplayControlsProps {
  history: MoveHistory[]
  currentIndex: number
  isPlaying: boolean
  playbackSpeed: number
  onIndexChange: (index: number) => void
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onClose: () => void
}

export default function ReplayControls({
  history,
  currentIndex,
  isPlaying,
  playbackSpeed,
  onIndexChange,
  onPlayPause,
  onSpeedChange,
  onClose
}: ReplayControlsProps) {
  if (history.length === 0) return null

  return (
    <div className="replay-controls-overlay" onClick={onClose}>
      <div className="replay-controls" onClick={e => e.stopPropagation()}>
        <div className="replay-header">
          <h3>📼 Replay Mode</h3>
          <button className="replay-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="replay-info">
          <div className="replay-move-info">
            Move {currentIndex + 1} of {history.length}
            {history[currentIndex] && (
              <>
                <span className="replay-direction">
                  {history[currentIndex].direction === 'up' && '↑'}
                  {history[currentIndex].direction === 'down' && '↓'}
                  {history[currentIndex].direction === 'left' && '←'}
                  {history[currentIndex].direction === 'right' && '→'}
                </span>
                <span className="replay-score">Score: {history[currentIndex].score}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="replay-timeline">
          <input
            type="range"
            min="0"
            max={history.length - 1}
            value={currentIndex}
            onChange={e => onIndexChange(parseInt(e.target.value))}
            className="replay-slider"
          />
        </div>
        
        <div className="replay-buttons">
          <button
            className="replay-btn"
            onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            ⏮ Prev
          </button>
          <button className="replay-btn replay-play" onClick={onPlayPause}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="replay-btn"
            onClick={() => onIndexChange(Math.min(history.length - 1, currentIndex + 1))}
            disabled={currentIndex === history.length - 1}
          >
            Next ⏭
          </button>
        </div>
        
        <div className="replay-speed">
          <label>Speed:</label>
          <button
            className={`replay-speed-btn ${playbackSpeed === 0.5 ? 'active' : ''}`}
            onClick={() => onSpeedChange(0.5)}
          >
            0.5×
          </button>
          <button
            className={`replay-speed-btn ${playbackSpeed === 1 ? 'active' : ''}`}
            onClick={() => onSpeedChange(1)}
          >
            1×
          </button>
          <button
            className={`replay-speed-btn ${playbackSpeed === 2 ? 'active' : ''}`}
            onClick={() => onSpeedChange(2)}
          >
            2×
          </button>
        </div>
      </div>
    </div>
  )
}
