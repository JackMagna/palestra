import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface Props {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  steps: number[];
  min?: number;
  decimals?: boolean;
  size?: 'xl' | 'lg';
}

/**
 * Valore grande con pulsanti rapidi. Toccando il numero lo si scrive a mano.
 * Pensato per l'uso con le mani sudate: bersagli di almeno 48px.
 */
export function NumberStepper({ label, unit, value, onChange, steps, min = 0, decimals, size = 'xl' }: Props) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const n = Number(text.replace(',', '.'));
    if (Number.isFinite(n)) onChange(Math.max(min, decimals ? Math.round(n * 4) / 4 : Math.round(n)));
    else setText(String(value));
  };
  const bump = (d: number) => onChange(Math.max(min, Math.round((value + d) * 100) / 100));
  const minus = [...steps].reverse();

  return (
    <div className="rounded-2xl bg-ink p-2.5 sm:p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => bump(-steps[0])} aria-label={`Togli ${steps[0]} ${unit}`} className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-raised text-chalk active:scale-95">
          <Minus className="h-6 w-6" />
        </button>
        <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
          <span className="sr-only">{label} in {unit}</span>
          <input
            inputMode={decimals ? 'decimal' : 'numeric'}
            value={text}
            onFocus={(e) => { setEditing(true); e.target.select(); }}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className={`w-full min-w-0 bg-transparent text-center font-display font-bold tabular-nums leading-none text-chalk outline-none focus:text-plate ${size === 'xl' ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-5xl'}`}
          />
          <span className="font-display text-xl font-semibold text-muted">{unit}</span>
        </label>
        <button type="button" onClick={() => bump(steps[0])} aria-label={`Aggiungi ${steps[0]} ${unit}`} className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-raised text-chalk active:scale-95">
          <Plus className="h-6 w-6" />
        </button>
      </div>
      {steps.length > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[...minus.slice(0, -1).map((s) => -s), ...steps.slice(1)].map((d) => (
            <button key={d} type="button" onClick={() => bump(d)} className="h-11 rounded-xl border border-line text-[15px] font-semibold tabular-nums text-muted active:scale-95 hover:text-chalk">
              {d > 0 ? `+${String(d).replace('.', ',')}` : `−${String(-d).replace('.', ',')}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
