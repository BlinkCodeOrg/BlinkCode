import { useRef, useEffect } from 'react';
import {
  DOT_GRID_BASE_R,
  DOT_GRID_GAP,
  DOT_GRID_MAX_R,
} from '../../features/dotGrid/dotGridConstants';
import { getBlobRadius } from '../../features/dotGrid/getBlobRadius';
import { hexToRgbTriplet } from '../../features/dotGrid/hexToRgbTriplet';

export default function DotGrid({ className, color = '#4f8cff' }: { className?: string; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef(0);
  const startTime = useRef(performance.now());
  const colorRef = useRef(color);
  colorRef.current = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const T = (performance.now() - startTime.current) / 1000;
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      const mx = mouse.current.x;
      const my = mouse.current.y;

      const startX = (w % DOT_GRID_GAP) / 2;
      const startY = (h % DOT_GRID_GAP) / 2;

      for (let x = startX; x < w; x += DOT_GRID_GAP) {
        for (let y = startY; y < h; y += DOT_GRID_GAP) {
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          const maxR = getBlobRadius(angle, T);

          let t = 0;
          if (dist < maxR) {
            t = 1 - dist / maxR;
          }

          const r = DOT_GRID_BASE_R + (DOT_GRID_MAX_R - DOT_GRID_BASE_R) * t * t;
          const alpha = 0.18 + 0.72 * t * t;

          const c = colorRef.current;
          const rgb = hexToRgbTriplet(c);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},${alpha})`;
          ctx.fill();

          if (t > 0.3) {
            ctx.beginPath();
            ctx.arc(x, y, r + 4 * t, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb},${0.12 * t})`;
            ctx.fill();
          }
        }
      }

      raf.current = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };

    const onLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 0,
      }}
    />
  );
}
