// Native Web Audio API Sound Synthesizer for Gaming Hub
let audioCtx: AudioContext | null = null;
let isMutedGlobal = localStorage.getItem('gaming_hub_mute') === 'true';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard and vendor-prefixed AudioContext
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume if suspended (browser security policies)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const audioService = {
  isMuted() {
    return isMutedGlobal;
  },

  setMuted(muted: boolean) {
    isMutedGlobal = muted;
    localStorage.setItem('gaming_hub_mute', String(muted));
  },

  toggleMute() {
    this.setMuted(!isMutedGlobal);
    return isMutedGlobal;
  },

  playClick() {
    if (isMutedGlobal) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },

  playMove() {
    if (isMutedGlobal) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  },

  playSuccess() {
    if (isMutedGlobal) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Play a pleasant major arpeggio/chord quickly
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.25);
    });
  },

  playExplosion() {
    if (isMutedGlobal) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Create white noise source
    const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Lowpass filter to make it sound like a boom
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.5);
  },

  playWin() {
    if (isMutedGlobal) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // A rising harmonic cascade
    const chords = [349.23, 440.0, 523.25, 659.25, 783.99, 1046.5]; // F major 7 -> C
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.55);
    });
  },
};
