import React, { useEffect, useMemo, useState } from 'react'
import Cell from './Cell'
import DevPanel, { DevButton, DevInfo, DevSection, useDevMode } from './DevPanel'
import { generateSudoku, solveSudoku, isValidMove, Grid } from '../utils/sudoku'

type Props = {
  difficulty?: 'easy' | 'medium' | 'hard'
  size?: number
  peerHighlightEnabled?: boolean
  fixedCellStyle?: 'filled' | 'outlined'
}

function clone(g: Grid): Grid {
  return g.map(r => r.slice())
}

function formatTime(s: number) {
  const mm = Math.floor(s / 60).toString().padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export default function Board({ difficulty = 'easy', size = 9, peerHighlightEnabled = true, fixedCellStyle = 'outlined' }: Props) {
  const isDevMode = useDevMode()
  const [initialPuzzle, setInitialPuzzle] = useState<Grid>(() => generateSudoku(difficulty, size))
  const [puzzle, setPuzzle] = useState<Grid>(() => clone(initialPuzzle))
  const [solution, setSolution] = useState<Grid | null>(() => solveSudoku(initialPuzzle))
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [timerRunning, setTimerRunning] = useState<boolean>(true)
  const [completed, setCompleted] = useState<boolean>(false)
  const [showCompletedModal, setShowCompletedModal] = useState<boolean>(false)
  const [notes, setNotes] = useState<Record<string, number[]>>({})
  const [undoStack, setUndoStack] = useState<Array<{ puzzle: Grid; notes: Record<string, number[]> }>>([])
  const [redoStack, setRedoStack] = useState<Array<{ puzzle: Grid; notes: Record<string, number[]> }>>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [invalidCells, setInvalidCells] = useState<Record<string, boolean>>({})
  const [pencilMode, setPencilMode] = useState(false)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)
  const [checkWrong, setCheckWrong] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ text: string; type?: 'info' | 'success' | 'error' } | null>(null)
  const [revealConfirm, setRevealConfirm] = useState(false)

  function pushHistory(prevPuzzle: Grid, prevNotes: Record<string, number[]>) {
    setUndoStack(s => [...s, { puzzle: clone(prevPuzzle), notes: { ...prevNotes } }])
    setRedoStack([])
  }

  function undo() {
    setUndoStack(us => {
      if (us.length === 0) return us
      const copy = us.slice()
      const last = copy.pop()!
      setRedoStack(rs => [...rs, { puzzle: clone(puzzle), notes: { ...notes } }])
      setPuzzle(clone(last.puzzle))
      setNotes({ ...last.notes })
      setInvalidCells({})
      return copy
    })
  }

  function redo() {
    setRedoStack(rs => {
      if (rs.length === 0) return rs
      const copy = rs.slice()
      const last = copy.pop()!
      setUndoStack(us => [...us, { puzzle: clone(puzzle), notes: { ...notes } }])
      setPuzzle(clone(last.puzzle))
      setNotes({ ...last.notes })
      setInvalidCells({})
      return copy
    })
  }

  useEffect(() => {
    // Regenerate when difficulty changes
    const g = generateSudoku(difficulty, size)
    setInitialPuzzle(g)
    setPuzzle(clone(g))
    setSolution(solveSudoku(g))
    setNotes({})
    setSelected(null)
    setInvalidCells({})
    // reset timer on new puzzle
    setElapsedSeconds(0)
    setTimerRunning(true)
    setCompleted(false)
  }, [difficulty, size])

  // Timer interval
  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  // detect completion: when puzzle equals solution
  useEffect(() => {
    if (!solution) return
    const n = puzzle.length
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (puzzle[r][c] !== solution[r][c]) return
      }
    }
    // solved
    if (!completed) {
      setCompleted(true)
      setTimerRunning(false)
      // show in-app modal instead of alert
      setTimeout(() => setShowCompletedModal(true), 20)
    }
  }, [puzzle, solution, completed, elapsedSeconds])

  const fixed = useMemo(() => initialPuzzle.map(r => r.map(v => v !== null)), [initialPuzzle])

  // compute peers (row, column, block) for the selected cell
  const peers = useMemo(() => {
    const s = new Set<string>()
    if (!selected) return s
    const [sr, sc] = selected
    const n = puzzle.length
    // row and column
    for (let i = 0; i < n; i++) {
      s.add(`${sr}-${i}`)
      s.add(`${i}-${sc}`)
    }
    // block
    const blockRows = size === 6 ? 2 : Math.floor(Math.sqrt(n))
    const blockCols = size === 6 ? 3 : Math.floor(Math.sqrt(n))
    const br = Math.floor(sr / blockRows) * blockRows
    const bc = Math.floor(sc / blockCols) * blockCols
    for (let r = br; r < br + blockRows; r++) for (let c = bc; c < bc + blockCols; c++) s.add(`${r}-${c}`)
    // remove selected itself (we already render selected separately)
    s.delete(`${sr}-${sc}`)
    return s
  }, [selected, puzzle, size])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Global shortcuts first
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        redo()
        return
      }
      // Toggle pencil mode with 'p' key
      if (e.key === 'p' || e.key === 'P') {
        setPencilMode(v => !v)
        return
      }
      if (!selected) return
      const [r, c] = selected
      const n = puzzle.length
      if (fixed[r][c]) return
      if (/^[1-9]$/.test(e.key)) {
        const num = Number(e.key)
        if (num < 1 || num > n) return
        if (pencilMode) {
          // toggle note (record history)
          pushHistory(puzzle, notes)
          setNotes(prev => {
            const key = `${r}-${c}`
            const cur = new Set(prev[key] ?? [])
            if (cur.has(num)) cur.delete(num)
            else cur.add(num)
            return { ...prev, [key]: Array.from(cur).sort((a,b)=>a-b) }
          })
          return
        }
        // record history
        pushHistory(puzzle, notes)
        setPuzzle(prev => {
          const next = prev.map(row => row.slice())
          // block invalid moves: test validity first
          const saved = next[r][c]
          next[r][c] = null
          const ok = isValidMove(next, r, c, num)
          next[r][c] = saved
          if (!ok) {
            // briefly mark cell invalid
            setInvalidCells(curr => ({ ...curr, [`${r}-${c}`]: true }))
            setTimeout(() => setInvalidCells(curr => { const cpy = { ...curr }; delete cpy[`${r}-${c}`]; return cpy }), 600)
            return prev
          }
          next[r][c] = num
          markInvalid(next)

          // remove this digit from peers' notes
          setNotes(prevNotes => {
            const cpy: Record<string, number[]> = { ...prevNotes }
            for (let rr = 0; rr < n; rr++) {
                const key = `${rr}-${c}`
                if (cpy[key]) cpy[key] = cpy[key].filter(x => x !== num)
                if (cpy[key] && cpy[key].length === 0) delete cpy[key]
              }
              for (let cc = 0; cc < n; cc++) {
                const key = `${r}-${cc}`
                if (cpy[key]) cpy[key] = cpy[key].filter(x => x !== num)
                if (cpy[key] && cpy[key].length === 0) delete cpy[key]
              }
              const blockRows = size === 6 ? 2 : Math.floor(Math.sqrt(n))
              const blockCols = size === 6 ? 3 : Math.floor(Math.sqrt(n))
              const br = Math.floor(r / blockRows) * blockRows
              const bc = Math.floor(c / blockCols) * blockCols
              for (let rr = br; rr < br + blockRows; rr++) for (let cc = bc; cc < bc + blockCols; cc++) {
                const key = `${rr}-${cc}`
                if (cpy[key]) cpy[key] = cpy[key].filter(x => x !== num)
                if (cpy[key] && cpy[key].length === 0) delete cpy[key]
              }
            return cpy
          })

          return next
        })
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (pencilMode) {
          pushHistory(puzzle, notes)
          setNotes(prev => {
            const key = `${r}-${c}`
            const cpy = { ...prev }
            delete cpy[key]
            return cpy
          })
        } else {
          pushHistory(puzzle, notes)
          setPuzzle(prev => {
            const next = prev.map(row => row.slice())
            next[r][c] = null
            markInvalid(next)
            return next
          })
        }
      } else if (e.key === 'ArrowUp') setSelected(([rr, cc]) => [Math.max(0, rr - 1), cc])
      else if (e.key === 'ArrowDown') setSelected(([rr, cc]) => [Math.min(n - 1, rr + 1), cc])
      else if (e.key === 'ArrowLeft') setSelected(([rr, cc]) => [rr, Math.max(0, cc - 1)])
      else if (e.key === 'ArrowRight') setSelected(([rr, cc]) => [rr, Math.min(n - 1, cc + 1)])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, fixed, pencilMode, puzzle, notes])

  function handleClick(r: number, c: number) {
    setSelected([r, c])
  }

  function markInvalid(grid: Grid) {
    const invalid: Record<string, boolean> = {}
    const n = grid.length
    const blockRows = size === 6 ? 2 : Math.floor(Math.sqrt(n))
    const blockCols = size === 6 ? 3 : Math.floor(Math.sqrt(n))
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = grid[r][c]
        if (!v) continue
        // Temporarily clear cell to test validity
        const saved = grid[r][c]
        grid[r][c] = null
        const ok = isValidMove(grid, r, c, saved as number)
        grid[r][c] = saved
        if (!ok) invalid[`${r}-${c}`] = true
      }
    }
    setInvalidCells(invalid)
  }

  function giveHint() {
    if (!solution) return
    const n = puzzle.length
    const empties: [number, number][] = []
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!puzzle[r][c]) empties.push([r, c])
    if (empties.length === 0) return
    const [r, c] = empties[Math.floor(Math.random() * empties.length)]
    // Push to history so hint can be undone
    pushHistory(puzzle, notes)
    setPuzzle(prev => {
      const next = prev.map(row => row.slice())
      next[r][c] = solution[r][c]
      markInvalid(next)
      return next
    })
  }

  function revealSolution() {
    if (!solution) {
      showToast('No solution available', 'error')
      return
    }
    // show in-app confirmation modal
    setRevealConfirm(true)
  }

  function doReveal() {
    if (!solution) return
    setPuzzle(clone(solution))
    setInvalidCells({})
    setTimerRunning(false)
    setRevealConfirm(false)
    showToast('Solution revealed', 'info')
  }

  function checkSolution() {
    if (!solution) {
      setCheckMessage('No solution available')
      setTimeout(() => setCheckMessage(null), 1800)
      return
    }
    const n = puzzle.length
    const wrongs: string[] = []
    let empties = 0
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const p = puzzle[r][c]
        if (!p) { empties++ ; continue }
        if (solution[r][c] !== p) wrongs.push(`${r}-${c}`)
      }
    }
    if (wrongs.length > 0) {
      const map: Record<string, boolean> = {}
      for (const k of wrongs) map[k] = true
      setCheckWrong(map)
      // briefly highlight wrong cells
      setTimeout(() => setCheckWrong({}), 1400)
      setCheckMessage(`${wrongs.length} incorrect cell${wrongs.length>1?'s':''}`)
      setTimeout(() => setCheckMessage(null), 1600)
      return
    }
    if (empties === 0) {
      // board is complete and matches solution
      if (!completed) setCompleted(true)
      setTimerRunning(false)
      setShowCompletedModal(true)
      return
    }
    // no wrong entries so far
    setCheckMessage('All entries correct so far')
    setTimeout(() => setCheckMessage(null), 1400)
  }

  function saveToStorage() {
    const payload = { puzzle, initialPuzzle, solution, difficulty, size, elapsedSeconds, timerRunning, notes, pencilMode }
    try {
      localStorage.setItem('sudoku-save-v1', JSON.stringify(payload))
      showToast('Saved to localStorage', 'success')
    } catch (e) {
      showToast('Save failed', 'error')
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem('sudoku-save-v1')
      if (!raw) { showToast('No saved game', 'info'); return }
      const obj = JSON.parse(raw)
      // Validate save data structure
      if (!obj || !Array.isArray(obj.puzzle) || !Array.isArray(obj.initialPuzzle)) {
        showToast('Invalid save data', 'error')
        return
      }
      // Validate grid dimensions
      const savedSize = obj.puzzle.length
      if (savedSize !== 6 && savedSize !== 9) {
        showToast('Invalid board size in save', 'error')
        return
      }
      if (obj.puzzle.some((row: any) => !Array.isArray(row) || row.length !== savedSize)) {
        showToast('Corrupted puzzle data', 'error')
        return
      }
      setInitialPuzzle(obj.initialPuzzle)
      setPuzzle(obj.puzzle)
      setSolution(obj.solution)
      setSelected(null)
      markInvalid(obj.puzzle)
      // Restore notes if present
      if (obj.notes && typeof obj.notes === 'object') {
        setNotes(obj.notes)
      } else {
        setNotes({})
      }
      // Restore pencil mode if present
      if (typeof obj.pencilMode === 'boolean') {
        setPencilMode(obj.pencilMode)
      }
      if (typeof obj.elapsedSeconds === 'number') setElapsedSeconds(obj.elapsedSeconds)
      if (typeof obj.timerRunning === 'boolean') setTimerRunning(!!obj.timerRunning)
      // Clear history on load for clean slate
      setUndoStack([])
      setRedoStack([])
      showToast('Loaded saved game', 'success')
    } catch (e) {
      showToast('Load failed', 'error')
    }
  }

  function showToast(text: string, type: 'info' | 'success' | 'error' = 'info') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 2200)
  }

  function resetToInitial() {
    setPuzzle(clone(initialPuzzle))
    setSelected(null)
    setInvalidCells({})
    setNotes({})
    // Clear history so user can't undo into pre-reset state
    setUndoStack([])
    setRedoStack([])
  }

  return (
    <div>
      <div className="board-card">
        <div className="board-left">
          <div className="timer-display">
            <div className="timer-value">{formatTime(elapsedSeconds)}</div>
            <div className="timer-actions">
              {timerRunning ? (
                <button className="btn-secondary" onClick={() => setTimerRunning(false)}>Pause</button>
              ) : (
                <button className="btn-secondary" onClick={() => setTimerRunning(true)}>Start</button>
              )}
              <button className="btn-secondary" onClick={() => { setElapsedSeconds(0); setTimerRunning(false) }}>Reset</button>
            </div>
          </div>

          <div className="board-controls" role="region" aria-label="Board controls">
            {/* Primary actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={checkSolution} className="btn-secondary">Check</button>
              <button onClick={giveHint} className="btn-secondary">Hint</button>
              <button onClick={() => setPencilMode(v => !v)} className={pencilMode ? 'btn-secondary' : ''} aria-pressed={pencilMode}>{pencilMode ? 'Pencil: ON' : 'Pencil: OFF'}</button>
            </div>
            {/* Secondary actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={undo} disabled={undoStack.length === 0}>Undo</button>
              <button onClick={redo} disabled={redoStack.length === 0}>Redo</button>
              <button onClick={resetToInitial}>Reset</button>
              <button onClick={saveToStorage} className="btn-tertiary">Save</button>
              <button onClick={loadFromStorage} className="btn-tertiary">Load</button>
              <button onClick={revealSolution} className="btn-danger">Reveal</button>
            </div>
          </div>

          {/* message / toast area */}
          <div style={{ minHeight: 28 }}>
            {checkMessage && <div className="message-bar">{checkMessage}</div>}
            {toast && <div className={`toast ${toast.type ?? 'info'}`}>{toast.text}</div>}
          </div>

          <div className="board" role="grid" aria-label="Sudoku board" data-size={puzzle.length} style={{ ['--cols' as any]: puzzle.length }}>
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
                    // pass invalid state
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

          {completed && <div className="completed-note">Completed: {formatTime(elapsedSeconds)}</div>}
        </div>

        {/* reveal confirmation modal */}
        {revealConfirm && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Reveal confirmation">
            <div className="modal">
              <h2>Reveal solution?</h2>
              <p>This will fill the board with the solution.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn-secondary" onClick={() => setRevealConfirm(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => doReveal()}>Reveal</button>
              </div>
            </div>
          </div>
        )}
        {showCompletedModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Puzzle completed">
            <div className="modal">
              <h2>Congratulations!</h2>
              <p>You solved the puzzle in <strong>{formatTime(elapsedSeconds)}</strong>.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn-secondary" onClick={() => { setShowCompletedModal(false) }}>Close</button>
                <button className="btn-primary" onClick={() => {
                  // start a new puzzle with same difficulty & size
                  const g = generateSudoku(difficulty, size)
                  setInitialPuzzle(g)
                  setPuzzle(clone(g))
                  setSolution(solveSudoku(g))
                  setNotes({})
                  setSelected(null)
                  setInvalidCells({})
                  setElapsedSeconds(0)
                  setTimerRunning(true)
                  setCompleted(false)
                  setShowCompletedModal(false)
                }}>Play Again</button>
              </div>
            </div>
          </div>
        )}
      </div>

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
            <DevButton onClick={() => {
              if (solution) {
                setPuzzle(clone(solution))
                setCompleted(true)
                setTimerRunning(false)
              }
            }} variant="success">
              🎯 Fill Solution
            </DevButton>
            <DevButton onClick={() => {
              if (solution && selected) {
                const [r, c] = selected
                if (!fixed[r][c]) {
                  pushHistory(puzzle, notes)
                  const updated = clone(puzzle)
                  updated[r][c] = solution[r][c]
                  setPuzzle(updated)
                }
              }
            }} variant="default">
              💡 Fill Selected Cell
            </DevButton>
            <DevButton onClick={() => {
              setCompleted(true)
              setTimerRunning(false)
              setShowCompletedModal(true)
            }} variant="success">
              🏆 Force Win
            </DevButton>
            <DevButton onClick={() => {
              setElapsedSeconds(0)
              setTimerRunning(true)
            }} variant="warning">
              ⏱️ Reset Timer
            </DevButton>
            <DevButton onClick={() => {
              const g = generateSudoku(difficulty, size)
              setInitialPuzzle(g)
              setPuzzle(clone(g))
              setSolution(solveSudoku(g))
              setNotes({})
              setSelected(null)
              setInvalidCells({})
              setElapsedSeconds(0)
              setTimerRunning(true)
              setCompleted(false)
              setUndoStack([])
              setRedoStack([])
            }} variant="default">
              🔄 New Puzzle
            </DevButton>
          </div>
        </DevSection>
        {solution && (
          <DevSection title="Solution Preview">
            <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4, whiteSpace: 'pre' }}>
              {solution.map((row, i) => row.join(' ')).join('\n')}
            </div>
          </DevSection>
        )}
      </DevPanel>
    </div>
  )
}
