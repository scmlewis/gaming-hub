import React, { useEffect, useRef, useState } from 'react'

type Option = { value: string | number; label: string }

type Props = {
  value: string | number
  options: Option[]
  onChange: (v: string | number) => void
  ariaLabel?: string
}

export default function Dropdown({ value, options, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<number>(-1)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const optionsRef = useRef<Array<HTMLLIElement | null>>([])

  useEffect(() => {
    if (open) {
      const idx = options.findIndex(o => String(o.value) === String(value))
      setActive(idx >= 0 ? idx : 0)
    }
  }, [open, value, options])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function toggle() {
    setOpen(v => !v)
  }

  function selectIndex(i: number) {
    const opt = options[i]
    if (!opt) return
    onChange(opt.value)
    setOpen(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(a => Math.min(a + 1, options.length - 1))
      optionsRef.current[Math.min(active + 1, options.length - 1)]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(a - 1, 0))
      optionsRef.current[Math.max(active - 1, 0)]?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0) selectIndex(active)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label ?? String(value)

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        type="button"
        className="dropdown-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={toggle}
        onKeyDown={onKey}
      >
        <span className="dropdown-label">{selectedLabel}</span>
        <span className="dropdown-caret">▾</span>
      </button>
      {open && (
        <ul className="dropdown-menu" role="listbox" tabIndex={-1} aria-label={ariaLabel}>
          {options.map((opt, i) => (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={String(opt.value) === String(value)}
              tabIndex={0}
              ref={el => (optionsRef.current[i] = el)}
              className={`dropdown-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
              onClick={() => selectIndex(i)}
              onKeyDown={e => { if (e.key === 'Enter') selectIndex(i) }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
