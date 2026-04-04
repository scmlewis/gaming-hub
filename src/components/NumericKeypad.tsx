import React from 'react';

type Props = {
  onPress: (key: number | 'clear' | 'backspace') => void;
  onClose?: () => void;
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
    <div className="mobile-keypad" role="toolbar" aria-label="Sudoku keypad">
      {/* Numbers 1-9 in single horizontal row */}
      <div className="keypad-numbers-row">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button
            type="button"
            key={n}
            className="keypad-number"
            onClick={() => {
              vibrate();
              onPress(n);
            }}
            aria-label={`Number ${n}`}
            title={`Enter ${n}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Action buttons row */}
      <div className="keypad-actions-row">
        <button
          type="button"
          className="keypad-action"
          onClick={() => {
            vibrate();
            onAction?.('undo');
          }}
          aria-label="Undo"
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          className="keypad-action"
          onClick={() => {
            vibrate();
            onAction?.('pencil');
          }}
          aria-label="Pencil marks"
          title="Pencil marks"
        >
          ✎
        </button>
        <button
          type="button"
          className="keypad-action"
          onClick={() => {
            vibrate();
            onAction?.('hint');
          }}
          aria-label="Hint"
          title="Hint"
        >
          💡
        </button>
        <button
          type="button"
          className="keypad-action"
          onClick={() => {
            vibrate();
            onAction?.('clear');
          }}
          aria-label="Clear"
          title="Clear"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
