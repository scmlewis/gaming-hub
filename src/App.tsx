import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

const SudokuPage = React.lazy(() => import('./pages/SudokuPage'));
const MinesweeperPage = React.lazy(() => import('./pages/MinesweeperPage'));
const Game2048Page = React.lazy(() => import('./pages/Game2048Page'));
const WordlePage = React.lazy(() => import('./pages/WordlePage'));
const TetrisPage = React.lazy(() => import('./pages/TetrisPage'));
const NonogramPage = React.lazy(() => import('./pages/NonogramPage'));
const SnakePage = React.lazy(() => import('./pages/SnakePage'));

function GameFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        minHeight: '100dvh',
        fontFamily: 'var(--font-display)',
        color: 'var(--text-tertiary)',
        fontSize: '18px',
      }}
    >
      Loading...
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <div className="app-root">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<GameFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sudoku" element={<SudokuPage />} />
            <Route path="/minesweeper" element={<MinesweeperPage />} />
            <Route path="/2048" element={<Game2048Page />} />
            <Route path="/wordle" element={<WordlePage />} />
            <Route path="/tetris" element={<TetrisPage />} />
            <Route path="/nonogram" element={<NonogramPage />} />
            <Route path="/snake" element={<SnakePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}
