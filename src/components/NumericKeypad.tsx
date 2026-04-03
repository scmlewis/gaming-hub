import React from 'react'

type Props = {
  onPress: (key: number | 'clear' | 'backspace') => void
  onClose?: () => void
}

export default function NumericKeypad({ onPress, onClose }: Props) {
  return (
    <div className="mobile-keypad" role="toolbar" aria-label="Numeric keypad">
      <div className="keypad-header">
        <button type="button" className="keypad-close" onClick={() => onClose && onClose()} aria-label="Close keypad">✕</button>
      </div>
      <div className="keypad-row">
        {[1,2,3].map(n => (
          <button type="button" key={n} className="keypad-key" onClick={() => { if (navigator && 'vibrate' in navigator) try { (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(20) } catch {} ; onPress(n) }} aria-label={`Number ${n}`}>{n}</button>
        ))}
      </div>
      <div className="keypad-row">
        {[4,5,6].map(n => (
          <button type="button" key={n} className="keypad-key" onClick={() => { if (navigator && 'vibrate' in navigator) try { (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(20) } catch {} ; onPress(n) }} aria-label={`Number ${n}`}>{n}</button>
        ))}
      </div>
      <div className="keypad-row">
        {[7,8,9].map(n => (
          <button type="button" key={n} className="keypad-key" onClick={() => { if (navigator && 'vibrate' in navigator) try { (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(20) } catch {} ; onPress(n) }} aria-label={`Number ${n}`}>{n}</button>
        ))}
      </div>
      <div className="keypad-row">
        <button type="button" className="keypad-key" onClick={() => { if (navigator && 'vibrate' in navigator) try { (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(20) } catch {} ; onPress('clear') }} aria-label="Clear">Clear</button>
        <button type="button" className="keypad-key" onClick={() => { if (navigator && 'vibrate' in navigator) try { (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(20) } catch {} ; onPress(0) }} aria-label="Zero">0</button>
        <button type="button" className="keypad-key" onClick={() => { if (navigator && 'vibrate' in navigator) try { (navigator as unknown as { vibrate: (ms: number) => void }).vibrate(20) } catch {} ; onPress('backspace') }} aria-label="Backspace">⌫</button>
      </div>
    </div>
  )
}
