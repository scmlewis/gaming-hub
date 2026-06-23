import React, { useState } from 'react';

type Props = {
  text: string;
  label?: string;
};

export default function ShareButton({ text, label = 'Share' }: Props) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button onClick={handleShare} className="btn-secondary" style={{ fontSize: '13px' }}>
      {copied ? '✓ Copied!' : label}
    </button>
  );
}
