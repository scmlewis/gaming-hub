import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SudokuPage from './pages/SudokuPage'
import MinesweeperPage from './pages/MinesweeperPage'
import Game2048Page from './pages/Game2048Page'
import WordlePage from './pages/WordlePage'

export default function App() {
  useEffect(() => {
    // Apply saved theme on mount
    const theme = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sudoku" element={<SudokuPage />} />
        <Route path="/minesweeper" element={<MinesweeperPage />} />
        <Route path="/2048" element={<Game2048Page />} />
        <Route path="/wordle" element={<WordlePage />} />
      </Routes>
    </BrowserRouter>
  )
}
