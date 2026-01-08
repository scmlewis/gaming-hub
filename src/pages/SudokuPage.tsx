import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import GameLayout from '../components/GameLayout'
import Board from '../components/Board'
import Dropdown from '../components/Dropdown'
import Settings from '../components/Settings'

export default function SudokuPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(() => {
    const paramDiff = searchParams.get('difficulty')
    return (paramDiff === 'easy' || paramDiff === 'medium' || paramDiff === 'hard') ? paramDiff : 'easy'
  })
  const [seed, setSeed] = useState<string>(() => searchParams.get('seed') || '')
  const [seedInput, setSeedInput] = useState('')
  const [size, setSize] = useState<6 | 9>(() => {
    const paramSize = searchParams.get('size')
    return paramSize === '6' ? 6 : 9
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [peerHighlight, setPeerHighlight] = useState<boolean>(() => {
    const v = localStorage.getItem('peerHighlight')
    return v === null ? true : v === 'true'
  })
  const [largeFont, setLargeFont] = useState<boolean>(() => {
    const v = localStorage.getItem('largeFont')
    return v === 'true'
  })
  const [fixedCellStyle, setFixedCellStyle] = useState<'filled' | 'outlined'>(() => 
    (localStorage.getItem('fixedCellStyle') as 'filled' | 'outlined') || 'outlined'
  )
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [accent, setAccent] = useState(() => localStorage.getItem('accent') || 'blue')

  const getAccentColor = (accentName: string) => {
    const colors: Record<string, string> = {
      'blue': '#6366f1',
      'teal': '#14b8a6',
      'purple': '#8b5cf6'
    }
    return colors[accentName] || colors['blue']
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
    localStorage.setItem('accent', accent)
    localStorage.setItem('fixedCellStyle', fixedCellStyle)
  }, [accent, fixedCellStyle])

  useEffect(() => {
    localStorage.setItem('peerHighlight', String(peerHighlight))
    localStorage.setItem('largeFont', String(largeFont))
    if (largeFont) document.documentElement.setAttribute('data-large-font', 'true')
    else document.documentElement.removeAttribute('data-large-font')
  }, [peerHighlight, largeFont])

  function newGame() {
    // Generate new seed and update URL
    const newSeed = Date.now().toString(36) + Math.random().toString(36).substring(2)
    setSeed(newSeed)
    setSeedInput('')
    setSearchParams({ difficulty, size: String(size), seed: newSeed })
  }

  function handleSeedSubmit() {
    if (seedInput.trim()) {
      setSeed(seedInput.trim())
      setSearchParams({ difficulty, size: String(size), seed: seedInput.trim() })
    }
  }

  function handleShareSeed() {
    const url = `${window.location.origin}${window.location.pathname}?difficulty=${difficulty}&size=${size}&seed=${seed}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Update URL when difficulty or size changes
  useEffect(() => {
    if (seed) {
      setSearchParams({ difficulty, size: String(size), seed })
    }
  }, [difficulty, size])

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ]

  const sizeOptions = [
    { value: 9, label: '9 × 9' },
    { value: 6, label: '6 × 6' },
  ]

  return (
    <GameLayout title="Sudoku" color={getAccentColor(accent)} icon="🧩">
      <div className="game-toolbar">
        <div className="toolbar-group">
          <Dropdown 
            ariaLabel="Select difficulty" 
            value={difficulty} 
            options={difficultyOptions} 
            onChange={v => setDifficulty(String(v) as any)} 
          />
          <Dropdown 
            ariaLabel="Select board size" 
            value={size} 
            options={sizeOptions} 
            onChange={v => setSize(Number(v) as 6 | 9)} 
          />
        </div>
        <div className="toolbar-group">
          <button onClick={newGame} className="btn-primary">✨ New Game</button>
          <button onClick={() => setSettingsOpen(true)} className="btn-icon" aria-label="Settings">⚙️</button>
        </div>
      </div>

      <Board
        key={`${seed}-${size}-${difficulty}`}
        difficulty={difficulty}
        size={size}
        peerHighlightEnabled={peerHighlight}
        fixedCellStyle={fixedCellStyle}
        seed={seed}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        peerHighlight={peerHighlight}
        onTogglePeerHighlight={() => setPeerHighlight(v => !v)}
        largeFont={largeFont}
        onToggleLargeFont={() => setLargeFont(v => !v)}
        fixedCellStyle={fixedCellStyle}
        onChangeFixedCellStyle={setFixedCellStyle}
        accent={accent}
        onChangeAccent={setAccent}
        seed={seed}
        seedInput={seedInput}
        onSeedInputChange={setSeedInput}
        onSeedSubmit={handleSeedSubmit}
        onShareSeed={handleShareSeed}
        copied={copied}
      />
    </GameLayout>
  )
}
