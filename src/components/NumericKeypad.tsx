import React from 'react';

type Props = {
  onPress: (key: number | 'clear' | 'backspace') => void;
};

const vibrate = (ms: number = 20) => {
  if (navigator && 'vibrate' in navigator)
    try {
      (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(ms);
    } catch (e) {
      void e;
    }
};

export default function NumericKeypad({ onPress }: Props) {
  return (
    <div className="sudoku-mobile-keypad">
      <div className="sudoku-keypad-numbers">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className="sudoku-keypad-number"
            onClick={() => { vibrate(); onPress(n); }}
            title={`Enter ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
