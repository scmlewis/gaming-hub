import React from 'react';
import { GameStats } from '../utils/stats';

type Props = {
  open: boolean;
  onClose: () => void;
  gameName: string;
  stats: GameStats;
};

export default function StatsModal({ open, onClose, gameName, stats }: Props) {
  if (!open) return null;

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${gameName} statistics`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{gameName} Statistics</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <StatBox label="Played" value={stats.played} />
          <StatBox label="Win Rate" value={`${winRate}%`} />
          <StatBox label="Current Streak" value={stats.currentStreak} />
          <StatBox label="Max Streak" value={stats.maxStreak} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '24px',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--accent-light)',
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}
