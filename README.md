# Gaming Hub

A collection of classic puzzle and logic games built with React + TypeScript + Vite. Features modern UI, mobile-responsive design, and smooth gameplay.

🎮 **Live Demo:** [https://gaming-hub-mu.vercel.app](https://gaming-hub-mu.vercel.app)

## Games

### 🔢 Sudoku
Complete grids with unique numbers following classic Sudoku rules. Features include:
- Multiple grid sizes (**6×6** or **9×9**)
- Multiple difficulty levels (Easy, Medium, Hard)
- **Seed Sharing** — Share specific puzzles via URL (accessible in Settings)
- Pencil/Notes mode for candidate numbers
- Hint system with optional auto-notes
- Undo/Redo functionality
- Real-time validation with conflict highlighting
- Timer with pause/resume
- Save/Load game state

### 💣 Minesweeper
Classic mine-sweeping game with advanced features:
- Three preset difficulty levels (Beginner, Intermediate, Expert)
- **Custom Board Size** — Create boards up to 50×50 with custom mine counts
- **Chord Clicking** — Middle-click to reveal adjacent cells when numbers are satisfied
- Flag mode for marking suspected mines
- Timer and mine counter
- First-click safety zone

### 🎲 2048
Slide numbered tiles to combine them and reach 2048:
- **5 Accent Colors** — Classic, Ocean, Neon, Sunset, Forest themes (in Settings)
- **Undo Moves** — Step back through your move history (up to 100 moves)
- **AI Hint System** — Get strategic move suggestions with explanations
- Smooth animations with tile tracking
- Score tracking with best score
- Keep playing mode after winning
- Mobile-optimized swiping (no screen scrolling)

### 🔤 Wordle
Guess the 5-letter word in 6 attempts:
- **Multi-Language Support** — Play in English, French (Français), or Spanish (Español)
- Language-specific keyboard layouts (QWERTY, AZERTY)
- Color-coded feedback (correct, present, absent)
- Keyboard highlighting
- Daily challenge mode

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
