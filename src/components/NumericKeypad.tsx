import React from 'react';

type Props = {
  onPress: (key: number | 'clear' | 'backspace') => void;
  onAction?: (action: 'undo' | 'pencil' | 'hint' | 'clear') => void;
};

const vibrate = (ms: number = 20) => {
  if (navigator && 'vibrate' in navigator)
    try {
      (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(ms);
    } catch (e) {
      void e;
    }
};

export default function NumericKeypad({ onPress, onAction }: Props) {
  return (
    <div className="sudoku-mobile-keypad">
      <div className="sudoku-keypad-numbers">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className="sudoku-keypad-number"
            onClick={() => { vibrate(); onPress(n); }}
            title={Enter }
          >
            {n}
          </button>
        ))}
      </div>
      <div className="sudoku-keypad-actions">
        <button className="sudoku-keypad-action" onClick={() => { vibrate(); onAction?.('undo'); }} title="Undo">↶</button>
        <button className="sudoku-keypad-action" onClick={() => { vibrate(); onAction?.('pencil'); }} title="Pencil">✎</button>
        <button className="sudoku-keypad-action" onClick={() => { vibrate(); onAction?.('hint'); }} title="Hint">💡</button>
        <button className="sudoku-keypad-action" onClick={() => { vibrate(); onAction?.('clear'); }} title="Clear">✕</button>
      </div>
    </div>
  );
}
