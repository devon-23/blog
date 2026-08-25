import { useEffect, useRef } from 'react';

const COLORS = ['#ffd76b', '#bf5230', '#1084d0', '#6b7f4f', '#d3992f'];
const MAX_PARTICLES = 18;
const SPAWN_EVERY_PX = 12;

export default function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return; // skip on touch

    const container = containerRef.current;
    if (!container) return;

    function spawn(x: number, y: number) {
      const el = document.createElement('div');
      el.className = 'cursor-trail-dot';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      container!.appendChild(el);
      requestAnimationFrame(() => el.classList.add('fade'));
      setTimeout(() => el.remove(), 600);

      while (container!.childElementCount > MAX_PARTICLES) {
        container!.firstElementChild?.remove();
      }
    }

    function onMove(e: MouseEvent) {
      const prev = lastPos.current;
      if (prev) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        if (Math.sqrt(dx * dx + dy * dy) < SPAWN_EVERY_PX) return;
      }
      lastPos.current = { x: e.clientX, y: e.clientY };
      spawn(e.clientX, e.clientY);
    }

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <div ref={containerRef} className="cursor-trail-layer" aria-hidden="true" />;
}
