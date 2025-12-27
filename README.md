# Sudoku — Gaming Hub

Minimal Vite + React + TypeScript scaffold for a Sudoku game.

## Setup

Open a PowerShell terminal in the project root and run:

```powershell
npm install
npm run dev
```

- `npm run dev` — start the dev server (Vite)
- `npm run build` — build for production
- `npm run preview` — preview production build

I'll implement the Sudoku generator, solver, UI features, and tests next. If you want a specific feature first (pencil mode, hints, difficulty selector), tell me and I'll prioritize it.
## Controls added

- `Hint` — fills one random empty cell with the correct value.
- `Check` — validates the current board against the solution.
- `Save` / `Load` — save current board to `localStorage` and restore it.
- `Reset` — reset the current puzzle to its initial state.

Validation: the UI now marks conflicting cells in red if a move creates a conflict. Fixed cells (from the generated puzzle) cannot be changed.
Blocking invalid moves: the UI now prevents entering numbers that would create conflicts. If you attempt an invalid move the cell briefly flashes red.

Pencil / Notes mode:

- Toggle pencil mode with the `Pencil: ON/OFF` button in the controls or by pressing the `P` key. While pencil mode is active, typing `1`–`9` will add/remove small candidate notes in the selected cell instead of filling it.
- Use Backspace/Delete while in pencil mode to clear notes for the selected cell.

Undo / Redo:

- Use the `Undo` and `Redo` buttons to step backward/forward through your recent moves (numbers and notes). You can also use `Ctrl+Z` / `Ctrl+Y` for keyboard shortcuts.
