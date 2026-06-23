import { useEffect, useRef } from 'react';

type Props = {
  active: boolean;
  duration?: number;
  particleCount?: number;
};

export default function Confetti({ active, duration = 3000, particleCount = 80 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#7a5cff', '#22c55e', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899', '#ffffff'];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      gravity: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 50,
        vx: (Math.random() - 0.5) * 8,
        vy: -(Math.random() * 12 + 6),
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.15,
        opacity: 1,
      });
    }

    let animationId: number;
    const startTime = Date.now();

    function animate() {
      if (!canvas || !ctx) return;
      const elapsed = Date.now() - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;

        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.99;

        // Fade out in the last 30% of duration
        if (elapsed > duration * 0.7) {
          p.opacity -= 0.02;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (alive && elapsed < duration) {
        animationId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [active, duration, particleCount]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
