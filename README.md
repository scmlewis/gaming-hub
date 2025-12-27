# Gaming Hub

A collection of classic puzzle and logic games built with React + TypeScript + Vite. Features modern UI, mobile-responsive design, and smooth gameplay.

🎮 **Live Demo:** [https://gaming-hub-mu.vercel.app](https://gaming-hub-mu.vercel.app)

## Games

### 🔢 Sudoku
Complete the 9×9 grid with numbers 1-9 following classic Sudoku rules. Features include:
- Multiple difficulty levels (Easy, Medium, Hard)
- Pencil/Notes mode for candidate numbers
- Hint system with optional auto-notes
- Undo/Redo functionality
- Real-time validation with conflict highlighting
- Timer with pause/resume
- Save/Load game state

### 💣 Minesweeper
Classic mine-sweeping game with three difficulty levels:
- Beginner (9×9, 10 mines)
- Intermediate (16×16, 40 mines)
- Expert (16×30, 99 mines)
- Flag mode for marking suspected mines
- Timer and mine counter

### 🎲 2048
Slide numbered tiles to combine them and reach 2048:
- Smooth animations
- Score tracking with best score
- Undo moves
- New game at any time

### 🔤 Wordle
Guess the 5-letter word in 6 attempts:
- Color-coded feedback (correct, present, absent)
- Keyboard highlighting
- Statistics tracking
- Streak counter

## Setup

```powershell
npm install
npm run dev
```

- `npm run dev` — start the dev server (Vite)
- `npm run build` — build for production
- `npm run preview` — preview production build
- `npm test` — run unit tests (Vitest)
- `npm run test:e2e` — run end-to-end tests (Playwright)

## Features

- 🎨 **Theme Switcher** — Light and Dark modes
- 📱 **Mobile Responsive** — Optimized for all screen sizes
- ⚡ **Fast & Modern** — Built with Vite for instant HMR
- 💾 **Persistent State** — Game progress saved to localStorage
- ⌨️ **Keyboard Controls** — Full keyboard support for all games
- 🧪 **Tested** — Unit and E2E tests included

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool and dev server
- **Vitest** — Unit testing
- **Playwright** — E2E testing
- **Vercel** — Deployment and hosting
