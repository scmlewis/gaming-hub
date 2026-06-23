import React from 'react';
import Cell from './Cell';
import DevPanel, { DevButton, DevInfo, DevSection } from './DevPanel';
import NumericKeypad from './NumericKeypad';
import useSudoku, { formatTime } from '../hooks/useSudoku';

type Props = {
  difficulty?: 'easy' | 'medium' | 'hard';
  size?: number;
  peerHighlightEnabled?: boolean;
  fixedCellStyle?: 'filled' | 'outlined';
  seed?: string;
};

function clone(g: ReturnType<typeof useSudoku>['puzzle']): ReturnType<typeof useSudoku>['puzzle'] {
  return g.map((r) => r.slice());
}

export default function Board({
  difficulty = 'easy',
  size = 9,
  peerHighlightEnabled = true,
  fixedCellStyle = 'outlined',
  seed,
}: Props) {
  const {
    puzzle,
    solution,
    elapsedSeconds,
    timerRunning,
    completed,
    showCompletedModal,
    notes,
    undoStack,
    redoStack,
    selected,
    invalidCells,
    pencilMode,
    checkMessage,
    checkWrong,
    toast,
    revealConfirm,
    showMobileActions,
    isMobileView,
    fixed,
    peers,
    setPuzzle,
    setTimerRunning,
    setElapsedSeconds,
    setCompleted,
    setPencilMode,
    setShowMobileActions,
    setShowCompletedModal,
    setRevealConfirm,
    undo,
    redo,
    handleNumberInput,
    handleClearAction,
    handleClick,
    checkSolution,
    revealSolution,
    doReveal,
    getHint: giveHint,
    saveGame: saveToStorage,
    loadGame: loadFromStorage,
    startNewGame,
    resetToInitial,
    pushHistory,
  } = useSudoku({ difficulty, size, peerHighlightEnabled, fixedCellStyle, seed });

  const actionButtons = (
    <>
      <button
        onClick={undo}
        disabled={undoStack.length === 0}
        className="sudoku-action-btn"
        aria-label="Undo last move"
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        onClick={redo}
        disabled={redoStack.length === 0}
        className="sudoku-action-btn"
        aria-label="Redo last move"
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
      <button
        onClick={handleClearAction}
        className="sudoku-action-btn"
        aria-label="Clear cell"
        title="Clear selected cell"
      >
        ⌫
      </button>
      <button
        onClick={() => setPencilMode((v) => !v)}
        className={`sudoku-action-btn ${pencilMode ? 'active' : ''}`}
        aria-pressed={pencilMode}
        aria-label="Toggle pencil mode"
        title="Pencil mode (notes)"
      >
        ✎
      </button>
      <button
        onClick={giveHint}
        className="sudoku-action-btn"
        aria-label="Use hint"
        title="Hint (reveals a cell)"
      >
        💡
      </button>
      <button
        onClick={checkSolution}
        className="sudoku-action-btn"
        aria-label="Check solution"
        title="Check if entries are valid"
      >
        ✓
      </button>
    </>
  );

  return (
    <div>
      <div className="board-card sudoku-layout">
        <div className="board-left">
          <div className="timer-display">
            <div className="timer-value">{formatTime(elapsedSeconds)}</div>
            <div className="timer-actions">
              {timerRunning ? (
                <button className="btn-secondary" onClick={() => setTimerRunning(false)}>
                  Pause
                </button>
              ) : (
                <button className="btn-secondary" onClick={() => setTimerRunning(true)}>
                  Start
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => {
                  setElapsedSeconds(0);
                  setTimerRunning(false);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {!isMobileView && (
            <div
              className="board-controls sudoku-mobile-controls"
              role="region"
              aria-label="Board controls"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={checkSolution} className="btn-secondary">
                  Check
                </button>
                <button onClick={giveHint} className="btn-secondary">
                  Hint
                </button>
                <button
                  onClick={() => setPencilMode((v) => !v)}
                  className={pencilMode ? 'btn-secondary' : ''}
                  aria-pressed={pencilMode}
                >
                  {pencilMode ? 'Pencil: ON' : 'Pencil: OFF'}
                </button>
              </div>
              <div
                className={`board-actions-secondary ${isMobileView ? 'mobile' : ''} ${
                  showMobileActions ? 'open' : ''
                }`}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <button onClick={undo} disabled={undoStack.length === 0}>
                  Undo
                </button>
                <button onClick={redo} disabled={redoStack.length === 0}>
                  Redo
                </button>
                <button onClick={resetToInitial}>Reset</button>
                <button onClick={saveToStorage} className="btn-tertiary">
                  Save
                </button>
                <button onClick={loadFromStorage} className="btn-tertiary">
                  Load
                </button>
                <button onClick={revealSolution} className="btn-danger">
                  Reveal
                </button>
              </div>
            </div>
          )}

          {isMobileView && (
            <div
              className="sudoku-action-row mobile-only"
              role="toolbar"
              aria-label="Quick actions"
            >
              {actionButtons}
              <button
                onClick={() => setShowMobileActions(true)}
                className="sudoku-action-btn"
                aria-label="More actions"
              >
                ⋯
              </button>
            </div>
          )}

          {isMobileView && showMobileActions && (
            <div
              className="mobile-actions-overlay"
              role="dialog"
              aria-modal="true"
              onClick={() => setShowMobileActions(false)}
            >
              <div className="mobile-actions-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-actions-header">
                  <span>More Actions</span>
                  <button
                    className="btn-icon"
                    aria-label="Close"
                    onClick={() => setShowMobileActions(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="mobile-actions-grid">
                  <button onClick={undo} disabled={undoStack.length === 0}>
                    Undo
                  </button>
                  <button onClick={redo} disabled={redoStack.length === 0}>
                    Redo
                  </button>
                  <button onClick={resetToInitial}>Reset</button>
                  <button onClick={saveToStorage} className="btn-tertiary">
                    Save
                  </button>
                  <button onClick={loadFromStorage} className="btn-tertiary">
                    Load
                  </button>
                  <button onClick={revealSolution} className="btn-danger">
                    Reveal
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ minHeight: 28 }}>
            {checkMessage && <div className="message-bar">{checkMessage}</div>}
            {toast && <div className={`toast ${toast.type ?? 'info'}`}>{toast.text}</div>}
          </div>

          <div
            className="board"
            role="grid"
            aria-label="Sudoku board"
            data-size={puzzle.length}
            style={{ '--cols': puzzle.length } as React.CSSProperties}
          >
            {puzzle.map((row, r) => (
              <div className="row" key={r} role="row">
                {row.map((val, c) => (
                  <Cell
                    key={`${r}-${c}`}
                    row={r}
                    col={c}
                    value={val}
                    fixed={fixed[r][c]}
                    fixedStyle={fixedCellStyle}
                    selected={selected ? selected[0] === r && selected[1] === c : false}
                    peer={peerHighlightEnabled ? peers.has(`${r}-${c}`) : false}
                    wrong={!!checkWrong[`${r}-${c}`]}
                    onClick={() => handleClick(r, c)}
                    invalid={!!invalidCells[`${r}-${c}`]}
                    notes={notes[`${r}-${c}`]}
                    size={puzzle.length}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="board-info">
            <p>Click a cell and type 1–{size} to fill. Use Backspace/Delete to clear.</p>
          </div>

          {completed && (
            <div className="completed-note">Completed: {formatTime(elapsedSeconds)}</div>
          )}
        </div>

        <aside className="board-side sudoku-side">
          <div className="sudoku-actions" role="toolbar" aria-label="Actions">
            {actionButtons}
          </div>
          <div className="sudoku-numpad" role="grid" aria-label="Number pad">
            {Array.from({ length: puzzle.length }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className="sudoku-numpad-btn"
                onClick={() => handleNumberInput(n)}
                aria-label={`Number ${n}`}
              >
                {n}
              </button>
            ))}
            <button
              className="sudoku-numpad-btn wide"
              onClick={handleClearAction}
              aria-label="Clear"
            >
              Clear
            </button>
          </div>
        </aside>

        {revealConfirm && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Reveal confirmation"
          >
            <div className="modal">
              <h2>Reveal solution?</h2>
              <p>This will fill the board with the solution.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn-secondary" onClick={() => setRevealConfirm(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={() => doReveal()}>
                  Reveal
                </button>
              </div>
            </div>
          </div>
        )}
        {showCompletedModal && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Puzzle completed"
          >
            <div className="modal">
              <h2>Congratulations!</h2>
              <p>
                You solved the puzzle in <strong>{formatTime(elapsedSeconds)}</strong>.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowCompletedModal(false);
                  }}
                >
                  Close
                </button>
                <button className="btn-primary" onClick={() => startNewGame()}>
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isMobileView && (
        <NumericKeypad
          onPress={(k) => {
            if (k === 'clear' || k === 'backspace' || k === 0) handleClearAction();
            else if (typeof k === 'number') handleNumberInput(k);
          }}
        />
      )}

      <DevPanel title="Sudoku Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Difficulty" value={difficulty} />
          <DevInfo label="Size" value={`${size}×${size}`} />
          <DevInfo label="Timer" value={formatTime(elapsedSeconds)} />
          <DevInfo label="Completed" value={completed ? 'Yes' : 'No'} />
          <DevInfo label="Has Solution" value={solution ? 'Yes' : 'No'} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <DevButton
              onClick={() => {
                if (solution) {
                  setPuzzle(clone(solution));
                  setCompleted(true);
                  setTimerRunning(false);
                }
              }}
              variant="success"
            >
              🎯 Fill Solution
            </DevButton>
            <DevButton
              onClick={() => {
                if (solution && selected) {
                  const [r, c] = selected;
                  if (!fixed[r][c]) {
                    pushHistory(puzzle, notes);
                    const updated = clone(puzzle);
                    updated[r][c] = solution[r][c];
                    setPuzzle(updated);
                  }
                }
              }}
              variant="default"
            >
              💡 Fill Selected Cell
            </DevButton>
            <DevButton
              onClick={() => {
                setCompleted(true);
                setTimerRunning(false);
                setShowCompletedModal(true);
              }}
              variant="success"
            >
              🏆 Force Win
            </DevButton>
            <DevButton
              onClick={() => {
                setElapsedSeconds(0);
                setTimerRunning(true);
              }}
              variant="warning"
            >
              ⏱️ Reset Timer
            </DevButton>
            <DevButton onClick={startNewGame} variant="default">
              🔄 New Puzzle
            </DevButton>
          </div>
        </DevSection>
        {solution && (
          <DevSection title="Solution Preview">
            <div
              style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4, whiteSpace: 'pre' }}
            >
              {solution.map((row) => row.join(' ')).join('\n')}
            </div>
          </DevSection>
        )}
      </DevPanel>
    </div>
  );
}
