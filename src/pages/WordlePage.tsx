import React, { useEffect, useState } from 'react';
import GameLayout from '../components/GameLayout';
import Icon from '../components/icons';
import Dropdown from '../components/Dropdown';
import DevPanel, { DevButton, DevInfo, DevSection } from '../components/DevPanel';
import Confetti from '../components/Confetti';
import StatsModal from '../components/StatsModal';
import ShareButton from '../components/ShareButton';
import { STORAGE_KEYS } from '../constants';
import { recordGame, getStats } from '../utils/stats';
import {
  GuessResult,
  LetterState,
  getRandomWord,
  getDailyWord,
  checkGuess,
  isValidWord,
  KEYBOARD_ROWS,
  WORD_LIST,
} from '../utils/wordle';
import {
  getRandomWordFR,
  getDailyWordFR,
  isValidWordFR,
  KEYBOARD_ROWS_FR,
  WORD_LIST_FR,
} from '../utils/wordleFR';
import {
  getRandomWordES,
  getDailyWordES,
  isValidWordES,
  KEYBOARD_ROWS_ES,
  WORD_LIST_ES,
} from '../utils/wordleES';

const MAX_GUESSES = 6;

type Language = 'en' | 'fr' | 'es';

export default function WordlePage() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORDLE_LANGUAGE);
    return saved === 'fr' || saved === 'es' ? saved : 'en';
  });

  const [isDaily, setIsDaily] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getWord = (daily: boolean) => {
    if (daily) {
      if (language === 'fr') return getDailyWordFR();
      if (language === 'es') return getDailyWordES();
      return getDailyWord();
    }
    if (language === 'fr') return getRandomWordFR();
    if (language === 'es') return getRandomWordES();
    return getRandomWord();
  };

  const validateWord = (word: string) => {
    if (language === 'fr') return isValidWordFR(word);
    if (language === 'es') return isValidWordES(word);
    return isValidWord(word);
  };

  const getKeyboardLayout = () => {
    if (language === 'fr') return KEYBOARD_ROWS_FR;
    if (language === 'es') return KEYBOARD_ROWS_ES;
    return KEYBOARD_ROWS;
  };

  const [answer, setAnswer] = useState(() => getWord(false));
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [skipValidation, setSkipValidation] = useState(false);
  const [keyStates, setKeyStates] = useState<Record<string, LetterState>>({});

  const triggerHaptic = (ms: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  // Save language preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORDLE_LANGUAGE, language);
  }, [language]);

  // Regenerate answer when language changes
  useEffect(() => {
    startNewGame();
  }, [language]);

  function startNewGame(daily = false) {
    const newAnswer = getWord(daily);
    setAnswer(newAnswer);
    setIsDaily(daily);
    setGuesses([]);
    setCurrentGuess('');
    setGameState('playing');
    setKeyStates({});
    setMessage(null);
    setShowConfetti(false);
  }

  function showMessage(msg: string, duration = 1500) {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  }

  function submitGuess() {
    if (currentGuess.length !== 5) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showMessage('Not enough letters');
      return;
    }

    if (!skipValidation && !validateWord(currentGuess)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showMessage('Not in word list');
      return;
    }

    const result = checkGuess(currentGuess, answer);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);

    // Update keyboard states
    const newKeyStates = { ...keyStates };
    result.forEach(({ letter, state }) => {
      const current = newKeyStates[letter];
      if (state === 'correct') {
        newKeyStates[letter] = 'correct';
      } else if (state === 'present' && current !== 'correct') {
        newKeyStates[letter] = 'present';
      } else if (!current) {
        newKeyStates[letter] = 'absent';
      }
    });
    setKeyStates(newKeyStates);

    setCurrentGuess('');

    if (currentGuess.toUpperCase() === answer) {
      setGameState('won');
      setShowConfetti(true);
      recordGame('wordle', true);
      showMessage('Excellent!', 3000);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState('lost');
      recordGame('wordle', false);
      showMessage(answer, 5000);
    }
  }

  function handleKey(key: string) {
    if (gameState !== 'playing') return;

    if (key === 'ENTER') {
      triggerHaptic(10);
      submitGuess();
    } else if (key === '⌫' || key === 'BACKSPACE') {
      triggerHaptic(6);
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      triggerHaptic(4);
      setCurrentGuess((prev) => prev + key);
    }
  }

  // Keyboard event listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (gameState !== 'playing') return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        e.preventDefault();
        submitGuess();
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, submitGuess, currentGuess]);

  // Build display rows (filled guesses + current + empty)
  const displayRows: (GuessResult | string | null)[] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      displayRows.push(guesses[i]);
    } else if (i === guesses.length && gameState === 'playing') {
      displayRows.push(currentGuess.padEnd(5, ' '));
    } else {
      displayRows.push(null);
    }
  }

  // Build share text
  const buildShareText = () => {
    const emojiMap: Record<string, string> = { correct: '🟩', present: '🟨', absent: '⬛' };
    const modeStr = isDaily ? ' Daily' : '';
    const rows = guesses.map((g) => g.map((l) => emojiMap[l.state]).join('')).join('\n');
    return `Wordle${modeStr} ${guesses.length}/${MAX_GUESSES}\n\n${rows}`;
  };

  const stats = getStats('wordle');

  return (
    <GameLayout title="Wordle" color="#22c55e" icon={<Icon name="wordle" />}>
      <Confetti active={showConfetti} />

      <div className="wordle-page">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            padding: '0 8px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Dropdown
              ariaLabel="Select language"
              value={language}
              options={[
                { value: 'en', label: 'English' },
                { value: 'fr', label: 'Français' },
                { value: 'es', label: 'Español' },
              ]}
              onChange={(v) => setLanguage(v as Language)}
            />
            <button
              onClick={() => startNewGame(!isDaily)}
              className={`btn-secondary ${isDaily ? 'selected' : ''}`}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              Daily
            </button>
          </div>
          <span
            className="game-stat"
            style={{ fontSize: '14px', color: 'var(--text-secondary)', flex: '0 0 auto' }}
          >
            {guesses.length}/{MAX_GUESSES}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setStatsOpen(true)}
              className="btn-icon"
              aria-label="View statistics"
              title="Statistics"
            >
              <span style={{ fontSize: '16px' }}>📊</span>
            </button>
            {gameState !== 'playing' && <ShareButton text={buildShareText()} />}
            <button
              onClick={() => startNewGame(isDaily)}
              className="btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                flex: '0 0 auto',
                whiteSpace: 'nowrap',
              }}
            >
              New
            </button>
          </div>
        </div>

        {message && <div className="wordle-message">{message}</div>}

        <div className="wordle-board">
          {displayRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`wordle-row ${rowIdx === guesses.length && shake ? 'shake' : ''}`}
            >
              {Array.from({ length: 5 }).map((_, colIdx) => {
                let letter = '';
                let state: LetterState = 'empty';

                if (Array.isArray(row)) {
                  letter = row[colIdx].letter;
                  state = row[colIdx].state;
                } else if (typeof row === 'string') {
                  letter = row[colIdx] || '';
                  state = letter.trim() ? 'tbd' : 'empty';
                }

                return (
                  <div key={colIdx} className={`wordle-tile ${state}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {gameState !== 'playing' && (
          <div className={`game-message ${gameState}`}>
            {gameState === 'won' ? 'You got it!' : `The word was: ${answer}`}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => startNewGame(isDaily)} className="btn-primary">
                Play Again
              </button>
              {isDaily && (
                <button onClick={() => startNewGame(false)} className="btn-secondary">
                  Practice
                </button>
              )}
            </div>
          </div>
        )}

        <div className="wordle-keyboard">
          {getKeyboardLayout().map((row, rowIdx) => (
            <div key={rowIdx} className="keyboard-row">
              {row.map((key) => (
                <button
                  key={key}
                  className={`keyboard-key ${keyStates[key] || ''} ${key.length > 1 ? 'wide' : ''}`}
                  onClick={() => handleKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        gameName="Wordle"
        stats={stats}
      />

      <DevPanel title="Wordle Dev Tools">
        <DevSection title="Game Info">
          <DevInfo label="Language" value={language.toUpperCase()} />
          <DevInfo label="Mode" value={isDaily ? 'Daily' : 'Practice'} />
          <DevInfo label="Answer" value={answer} />
          <DevInfo label="Guesses" value={`${guesses.length}/${MAX_GUESSES}`} />
          <DevInfo label="State" value={gameState} />
        </DevSection>
        <DevSection title="Actions">
          <div className="dev-actions">
            <DevButton onClick={() => setCurrentGuess(answer.toUpperCase())} variant="success">
              Auto-fill Answer
            </DevButton>
            <DevButton
              onClick={() => {
                const wordList =
                  language === 'fr' ? WORD_LIST_FR : language === 'es' ? WORD_LIST_ES : WORD_LIST;
                const randomWord =
                  wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
                setCurrentGuess(randomWord);
              }}
              variant="default"
            >
              Random Valid Word
            </DevButton>
            <DevButton
              onClick={() => setSkipValidation(!skipValidation)}
              variant={skipValidation ? 'warning' : 'default'}
            >
              {skipValidation ? 'Skip Validation ON' : 'Skip Validation OFF'}
            </DevButton>
            <DevButton onClick={() => setGameState('won')} variant="success">
              Force Win
            </DevButton>
            <DevButton onClick={() => setGameState('lost')} variant="danger">
              Force Lose
            </DevButton>
            <DevButton onClick={() => startNewGame(isDaily)} variant="default">
              Reset Game
            </DevButton>
          </div>
        </DevSection>
      </DevPanel>
    </GameLayout>
  );
}
