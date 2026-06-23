import { useEffect, useMemo, useState } from 'react';
import { generateSudoku, solveSudoku, isValidMove, Grid } from '../utils/sudoku';
import { MAX_HISTORY_SIZE } from '../constants';
import { audioService } from '../utils/audio';
import { recordGame } from '../utils/stats';

type Props = {
  difficulty?: 'easy' | 'medium' | 'hard';
  size?: number;
  peerHighlightEnabled?: boolean;
  fixedCellStyle?: 'filled' | 'outlined';
  seed?: string;
};

function clone(g: Grid): Grid {
  return g.map((r) => r.slice());
}

export function formatTime(s: number) {
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function useSudoku({
  difficulty = 'easy',
  size = 9,
  peerHighlightEnabled = true,
  fixedCellStyle = 'outlined',
  seed,
}: Props) {
  const [initialPuzzle, setInitialPuzzle] = useState<Grid>(
    () => generateSudoku(difficulty, size, seed).puzzle
  );
  const [puzzle, setPuzzle] = useState<Grid>(() => clone(initialPuzzle));
  const [solution, setSolution] = useState<Grid | null>(() => solveSudoku(initialPuzzle));
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [completed, setCompleted] = useState<boolean>(false);
  const [showCompletedModal, setShowCompletedModal] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [undoStack, setUndoStack] = useState<
    Array<{ puzzle: Grid; notes: Record<string, number[]> }>
  >([]);
  const [redoStack, setRedoStack] = useState<
    Array<{ puzzle: Grid; notes: Record<string, number[]> }>
  >([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [invalidCells, setInvalidCells] = useState<Record<string, boolean>>({});
  const [pencilMode, setPencilMode] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checkWrong, setCheckWrong] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ text: string; type?: 'info' | 'success' | 'error' } | null>(
    null
  );
  const [revealConfirm, setRevealConfirm] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const [isMobileView, setIsMobileView] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  function pushHistory(prevPuzzle: Grid, prevNotes: Record<string, number[]>) {
    setUndoStack((s) =>
      [...s, { puzzle: clone(prevPuzzle), notes: { ...prevNotes } }].slice(-MAX_HISTORY_SIZE)
    );
    setRedoStack([]);
  }

  function undo() {
    setUndoStack((us) => {
      if (us.length === 0) return us;
      const copy = us.slice();
      const last = copy.pop()!;
      setRedoStack((rs) => [...rs, { puzzle: clone(puzzle), notes: { ...notes } }]);
      setPuzzle(clone(last.puzzle));
      setNotes({ ...last.notes });
      setInvalidCells({});
      return copy;
    });
  }

  function redo() {
    setRedoStack((rs) => {
      if (rs.length === 0) return rs;
      const copy = rs.slice();
      const last = copy.pop()!;
      setUndoStack((us) => [...us, { puzzle: clone(puzzle), notes: { ...notes } }]);
      setPuzzle(clone(last.puzzle));
      setNotes({ ...last.notes });
      setInvalidCells({});
      return copy;
    });
  }

  function markInvalid(grid: Grid): void {
    const invalid: Record<string, boolean> = {};
    const n = grid.length;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = grid[r][c];
        if (!v) continue;
        const ok = isValidMove(grid, r, c, v);
        if (!ok) invalid[`${r}-${c}`] = true;
      }
    }
    setInvalidCells(invalid);
  }

  function showToast(text: string, type: 'info' | 'success' | 'error' = 'info') {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2200);
  }

  function triggerHaptic(ms: number) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  }

  // Regenerate when difficulty, size, or seed changes
  useEffect(() => {
    const result = generateSudoku(difficulty, size, seed);
    setInitialPuzzle(result.puzzle);
    setPuzzle(clone(result.puzzle));
    setSolution(result.solution);
    setNotes({});
    setSelected(null);
    setInvalidCells({});
    setElapsedSeconds(0);
    setTimerRunning(true);
    setCompleted(false);
  }, [difficulty, size]);

  // Timer interval
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // detect completion: when puzzle equals solution
  useEffect(() => {
    if (!solution) return;
    const n = puzzle.length;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (puzzle[r][c] !== solution[r][c]) return;
      }
    }
    if (!completed) {
      setCompleted(true);
      setTimerRunning(false);
      recordGame('sudoku', true);
      audioService.playWin();
      setTimeout(() => setShowCompletedModal(true), 20);
    }
  }, [puzzle, solution, completed]);

  // Mobile / touch helpers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (ev: MediaQueryListEvent) => setIsMobileView(ev.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler as unknown as EventListener);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler as unknown as EventListener);
    };
  }, []);

  // Close mobile actions panel when leaving mobile view
  useEffect(() => {
    if (!isMobileView) setShowMobileActions(false);
  }, [isMobileView]);

  const fixed = useMemo(() => initialPuzzle.map((r) => r.map((v) => v !== null)), [initialPuzzle]);

  const peers = useMemo(() => {
    const s = new Set<string>();
    if (!selected) return s;
    const [sr, sc] = selected;
    const n = puzzle.length;
    for (let i = 0; i < n; i++) {
      s.add(`${sr}-${i}`);
      s.add(`${i}-${sc}`);
    }
    const blockRows = size === 6 ? 2 : Math.floor(Math.sqrt(n));
    const blockCols = size === 6 ? 3 : Math.floor(Math.sqrt(n));
    const br = Math.floor(sr / blockRows) * blockRows;
    const bc = Math.floor(sc / blockCols) * blockCols;
    for (let r = br; r < br + blockRows; r++)
      for (let c = bc; c < bc + blockCols; c++) s.add(`${r}-${c}`);
    s.delete(`${sr}-${sc}`);
    return s;
  }, [selected, puzzle, size]);

  // Keyboard events
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        setPencilMode((v) => !v);
        return;
      }
      if (!selected) return;
      const [r, c] = selected;
      const n = puzzle.length;
      if (fixed[r][c]) return;
      if (/^[1-9]$/.test(e.key)) {
        const num = Number(e.key);
        if (num < 1 || num > n) return;
        if (pencilMode) {
          pushHistory(puzzle, notes);
          setNotes((prev) => {
            const key = `${r}-${c}`;
            const cur = new Set(prev[key] ?? []);
            if (cur.has(num)) cur.delete(num);
            else cur.add(num);
            return { ...prev, [key]: Array.from(cur).sort((a, b) => a - b) };
          });
          return;
        }
        pushHistory(puzzle, notes);
        setPuzzle((prev) => {
          const next = prev.map((row) => row.slice());
          const saved = next[r][c];
          next[r][c] = null;
          const ok = isValidMove(next, r, c, num);
          next[r][c] = saved;
          if (!ok) {
            setInvalidCells((curr) => ({ ...curr, [`${r}-${c}`]: true }));
            setTimeout(
              () =>
                setInvalidCells((curr) => {
                  const cpy = { ...curr };
                  delete cpy[`${r}-${c}`];
                  return cpy;
                }),
              600
            );
            return prev;
          }
          next[r][c] = num;
          markInvalid(next);
          audioService.playMove();

          setNotes((prevNotes) => {
            const cpy: Record<string, number[]> = { ...prevNotes };
            for (let rr = 0; rr < n; rr++) {
              const key = `${rr}-${c}`;
              if (cpy[key]) cpy[key] = cpy[key].filter((x) => x !== num);
              if (cpy[key] && cpy[key].length === 0) delete cpy[key];
            }
            for (let cc = 0; cc < n; cc++) {
              const key = `${r}-${cc}`;
              if (cpy[key]) cpy[key] = cpy[key].filter((x) => x !== num);
              if (cpy[key] && cpy[key].length === 0) delete cpy[key];
            }
            const blockRows = size === 6 ? 2 : Math.floor(Math.sqrt(n));
            const blockCols = size === 6 ? 3 : Math.floor(Math.sqrt(n));
            const br = Math.floor(r / blockRows) * blockRows;
            const bc = Math.floor(c / blockCols) * blockCols;
            for (let rr = br; rr < br + blockRows; rr++)
              for (let cc = bc; cc < bc + blockCols; cc++) {
                const key = `${rr}-${cc}`;
                if (cpy[key]) cpy[key] = cpy[key].filter((x) => x !== num);
                if (cpy[key] && cpy[key].length === 0) delete cpy[key];
              }
            return cpy;
          });

          return next;
        });
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (pencilMode) {
          pushHistory(puzzle, notes);
          setNotes((prev) => {
            const key = `${r}-${c}`;
            const cpy = { ...prev };
            delete cpy[key];
            return cpy;
          });
        } else {
          pushHistory(puzzle, notes);
          setPuzzle((prev) => {
            const next = prev.map((row) => row.slice());
            next[r][c] = null;
            markInvalid(next);
            return next;
          });
        }
      } else if (e.key === 'ArrowUp')
        setSelected((prev) => (prev ? [Math.max(0, prev[0] - 1), prev[1]] : null));
      else if (e.key === 'ArrowDown')
        setSelected((prev) => (prev ? [Math.min(n - 1, prev[0] + 1), prev[1]] : null));
      else if (e.key === 'ArrowLeft')
        setSelected((prev) => (prev ? [prev[0], Math.max(0, prev[1] - 1)] : null));
      else if (e.key === 'ArrowRight')
        setSelected((prev) => (prev ? [prev[0], Math.min(n - 1, prev[1] + 1)] : null));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, fixed, pencilMode, puzzle, notes]);

  function handleNumberInput(num: number) {
    if (!selected) return;
    const [r, c] = selected;
    const n = puzzle.length;
    if (fixed[r][c]) return;
    if (num === 0) return;
    if (pencilMode) {
      pushHistory(puzzle, notes);
      setNotes((prev) => {
        const key = `${r}-${c}`;
        const cur = new Set(prev[key] ?? []);
        if (cur.has(num)) cur.delete(num);
        else cur.add(num);
        return { ...prev, [key]: Array.from(cur).sort((a: number, b: number) => a - b) };
      });
      if (isMobileView) setTimeout(() => setSelected(null), 150);
      return;
    }
    pushHistory(puzzle, notes);
    setPuzzle((prev) => {
      const next = prev.map((row) => row.slice());
      const ok = isValidMove(next, r, c, num);
      if (!ok) {
        setInvalidCells((curr) => ({ ...curr, [`${r}-${c}`]: true }));
        setTimeout(
          () =>
            setInvalidCells((curr) => {
              const cpy = { ...curr };
              delete cpy[`${r}-${c}`];
              return cpy;
            }),
          600
        );
        return prev;
      }
      next[r][c] = num;
      markInvalid(next);
      triggerHaptic(10);
      audioService.playMove();
      if (isMobileView) setTimeout(() => setSelected(null), 150);

      setNotes((prevNotes) => {
        const cpy: Record<string, number[]> = { ...prevNotes };
        for (let rr = 0; rr < n; rr++) {
          const key = `${rr}-${c}`;
          if (cpy[key]) cpy[key] = cpy[key].filter((x: number): boolean => x !== num);
          if (cpy[key] && cpy[key].length === 0) delete cpy[key];
        }
        for (let cc = 0; cc < n; cc++) {
          const key = `${r}-${cc}`;
          if (cpy[key]) cpy[key] = cpy[key].filter((x: number) => x !== num);
          if (cpy[key] && cpy[key].length === 0) delete cpy[key];
        }
        const blockRowsSize = size === 6 ? 2 : Math.floor(Math.sqrt(n));
        const blockColsSize = size === 6 ? 3 : Math.floor(Math.sqrt(n));
        const blockRow = Math.floor(r / blockRowsSize) * blockRowsSize;
        const blockCol = Math.floor(c / blockColsSize) * blockColsSize;
        for (let rr = blockRow; rr < blockRow + blockRowsSize; rr++)
          for (let cc = blockCol; cc < blockCol + blockColsSize; cc++) {
            const key = `${rr}-${cc}`;
            if (cpy[key]) cpy[key] = cpy[key].filter((x) => x !== num);
            if (cpy[key] && cpy[key].length === 0) delete cpy[key];
          }
        return cpy;
      });

      return next;
    });
  }

  function handleClearAction(): void {
    if (!selected) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    triggerHaptic(8);
    if (pencilMode) {
      pushHistory(puzzle, notes);
      setNotes((prev) => {
        const key = `${r}-${c}`;
        const cpy = { ...prev };
        delete cpy[key];
        return cpy;
      });
    } else {
      pushHistory(puzzle, notes);
      setPuzzle((prev) => {
        const next = prev.map((row) => row.slice());
        next[r][c] = null;
        markInvalid(next);
        return next;
      });
    }
    if (isMobileView) setTimeout(() => setSelected(null), 150);
  }

  function handleClick(r: number, c: number) {
    setSelected([r, c]);
    triggerHaptic(6);
    audioService.playClick();
  }

  function giveHint() {
    if (!solution) return;
    const n = puzzle.length;
    const empties: [number, number][] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!puzzle[r][c]) empties.push([r, c]);
    if (empties.length === 0) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    pushHistory(puzzle, notes);
    setPuzzle((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = solution[r][c];
      markInvalid(next);
      return next;
    });
  }

  function revealSolution() {
    if (!solution) {
      showToast('No solution available', 'error');
      return;
    }
    setRevealConfirm(true);
  }

  function doReveal() {
    if (!solution) return;
    setPuzzle(clone(solution));
    setInvalidCells({});
    setTimerRunning(false);
    setRevealConfirm(false);
    showToast('Solution revealed', 'info');
  }

  function checkSolution() {
    if (!solution) {
      setCheckMessage('No solution available');
      setTimeout(() => setCheckMessage(null), 1800);
      return;
    }
    const n = puzzle.length;
    const wrongs: string[] = [];
    let empties = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const p = puzzle[r][c];
        if (!p) {
          empties++;
          continue;
        }
        if (solution[r][c] !== p) wrongs.push(`${r}-${c}`);
      }
    }
    if (wrongs.length > 0) {
      const map: Record<string, boolean> = {};
      for (const k of wrongs) map[k] = true;
      setCheckWrong(map);
      setTimeout(() => setCheckWrong({}), 1400);
      setCheckMessage(`${wrongs.length} incorrect cell${wrongs.length > 1 ? 's' : ''}`);
      setTimeout(() => setCheckMessage(null), 1600);
      return;
    }
    if (empties === 0) {
      if (!completed) setCompleted(true);
      setTimerRunning(false);
      setShowCompletedModal(true);
      return;
    }
    setCheckMessage('All entries correct so far');
    setTimeout(() => setCheckMessage(null), 1400);
  }

  function saveToStorage() {
    const payload = {
      puzzle,
      initialPuzzle,
      solution,
      difficulty,
      size,
      elapsedSeconds,
      timerRunning,
      notes,
      pencilMode,
    };
    try {
      localStorage.setItem('sudoku-save-v1', JSON.stringify(payload));
      showToast('Saved to localStorage', 'success');
    } catch (e) {
      showToast('Save failed', 'error');
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem('sudoku-save-v1');
      if (!raw) {
        showToast('No saved game', 'info');
        return;
      }
      const obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.puzzle) || !Array.isArray(obj.initialPuzzle)) {
        showToast('Invalid save data', 'error');
        return;
      }
      const savedSize = obj.puzzle.length;
      if (savedSize !== 6 && savedSize !== 9) {
        showToast('Invalid board size in save', 'error');
        return;
      }
      if (
        obj.puzzle.some(
          (row: unknown) => !Array.isArray(row) || (row as unknown[]).length !== savedSize
        )
      ) {
        showToast('Corrupted puzzle data', 'error');
        return;
      }
      setInitialPuzzle(obj.initialPuzzle);
      setPuzzle(obj.puzzle);
      setSolution(obj.solution);
      setSelected(null);
      markInvalid(obj.puzzle);
      if (obj.notes && typeof obj.notes === 'object') {
        setNotes(obj.notes);
      } else {
        setNotes({});
      }
      if (typeof obj.pencilMode === 'boolean') {
        setPencilMode(obj.pencilMode);
      }
      if (typeof obj.elapsedSeconds === 'number') setElapsedSeconds(obj.elapsedSeconds);
      if (typeof obj.timerRunning === 'boolean') setTimerRunning(!!obj.timerRunning);
      setUndoStack([]);
      setRedoStack([]);
      showToast('Loaded saved game', 'success');
    } catch (e) {
      showToast('Load failed', 'error');
    }
  }

  function resetToInitial() {
    setPuzzle(clone(initialPuzzle));
    setSelected(null);
    setInvalidCells({});
    setNotes({});
    setUndoStack([]);
    setRedoStack([]);
  }

  function startNewGame() {
    const g = generateSudoku(difficulty, size);
    setInitialPuzzle(g.puzzle);
    setPuzzle(clone(g.puzzle));
    setSolution(g.solution);
    setNotes({});
    setSelected(null);
    setInvalidCells({});
    setElapsedSeconds(0);
    setTimerRunning(true);
    setCompleted(false);
    setShowCompletedModal(false);
    setUndoStack([]);
    setRedoStack([]);
  }

  return {
    // State
    initialPuzzle,
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
    // Setters (for direct UI control)
    setInitialPuzzle,
    setPuzzle,
    setSolution,
    setTimerRunning,
    setElapsedSeconds,
    setCompleted,
    setPencilMode,
    setSelected,
    setInvalidCells,
    setNotes,
    setUndoStack,
    setRedoStack,
    setShowMobileActions,
    setShowCompletedModal,
    setRevealConfirm,
    // Functions
    pushHistory,
    undo,
    redo,
    selectCell: handleClick,
    handleNumberInput,
    handleClearAction,
    handleClick,
    togglePencilMode: () => setPencilMode((v) => !v),
    checkSolution,
    revealSolution,
    doReveal,
    getHint: giveHint,
    pauseTimer: () => setTimerRunning(false),
    resetTimer: () => {
      setElapsedSeconds(0);
      setTimerRunning(false);
    },
    startResumeTimer: () => setTimerRunning(true),
    saveGame: saveToStorage,
    loadGame: loadFromStorage,
    startNewGame,
    resetToInitial,
    showToast,
    triggerHaptic,
    // Types
    difficulty,
    size,
    peerHighlightEnabled,
    fixedCellStyle,
  };
}
