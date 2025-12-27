import React from 'react'

type Props = {
  row: number
  col: number
  value?: number | null
  fixed?: boolean
  fixedStyle?: 'filled' | 'outlined'
  selected?: boolean
  peer?: boolean
  wrong?: boolean
  invalid?: boolean
  notes?: number[]
  size?: number
  onClick?: () => void
}

export default function Cell({ row, col, value, fixed = false, fixedStyle = 'filled', selected = false, peer = false, wrong = false, invalid = false, notes, size = 9, onClick }: Props) {
  const fixedClass = fixed ? (fixedStyle === 'outlined' ? 'cell-fixed--outlined' : 'cell-fixed--filled') : ''
  const className = ['cell', fixedClass, selected ? 'cell-selected' : '', invalid ? 'cell-invalid' : '', peer ? 'cell-peer' : '']
  if (wrong) className.push('cell-wrong')
  return (
    <button
      role="gridcell"
      className={className.join(' ')}
      data-size={size}
      data-peer={peer ? 'true' : undefined}
      aria-label={`Cell ${row + 1}-${col + 1}`}
      aria-readonly={fixed}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      onFocus={onClick}
      data-invalid={invalid ? 'true' : undefined}
    >
      {value ?? (
        notes && notes.length > 0 ? (
          <div className="cell-notes" aria-hidden>
            {Array.from({ length: size }, (_, i) => (
              <span key={i} className={notes.includes(i + 1) ? 'note-on' : 'note-off'}>{i + 1}</span>
            ))}
          </div>
        ) : ''
      )}
    </button>
  )
}

// no unused helpers
