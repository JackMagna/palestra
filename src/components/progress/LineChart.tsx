import { useEffect, useRef, useState } from 'react';
import { formatDate, formatKg } from '../../lib/ids';

interface Point { date: string; value: number }

/** Grafico a linee che si adatta alla larghezza reale (niente testo deformato). */
export function LineChart({ data, unit, label }: { data: Point[]; unit: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (data.length === 0) return <div ref={ref} className="py-8 text-center text-[15px] text-muted">Ancora nessun dato.</div>;

  const height = 180;
  const pad = { l: 40, r: 12, t: 16, b: 26 };
  const values = data.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.1; max += span * 0.1;

  const x = (i: number) => pad.l + (data.length === 1 ? (width - pad.l - pad.r) / 2 : (i / (data.length - 1)) * (width - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const ticks = [max, (max + min) / 2, min];
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.floor(width / 70)));
  const last = data[data.length - 1];

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={`${label}: ultimo valore ${formatKg(last.value)} ${unit}`} className="block">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-faint)">{formatKg(t)}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--color-plate)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 4.5 : 3} fill="var(--color-panel)" stroke="var(--color-plate)" strokeWidth={2} />
            {i % labelEvery === 0 && (
              <text x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--color-faint)">{formatDate(d.date)}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
