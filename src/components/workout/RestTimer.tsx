import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { sound, vibrate } from '../../lib/sound';

interface Props {
  /** cambia a ogni serie completata: riavvia il timer */
  startKey: number;
  seconds: number;
  onClose: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Timer di recupero basato sull'orario di fine, così resta preciso anche se
 * il telefono mette in pausa la pagina mentre è bloccato.
 */
export function RestTimer({ startKey, seconds, onClose }: Props) {
  const [startAt, setStartAt] = useState(() => Date.now());
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(Date.now());
  const done = useRef(false);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    const t = Date.now();
    setStartAt(t);
    setEndAt(t + seconds * 1000);
    setNow(t);
    done.current = false;
  }, [startKey, seconds]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, Math.ceil((endAt - now) / 1000));
  const finished = left === 0;

  useEffect(() => {
    if (finished && !done.current) {
      done.current = true;
      sound.restOver();
      vibrate([300, 150, 300]);
    } else if (!finished && left <= 3 && lastTick.current !== left) {
      lastTick.current = left;
      sound.tick();
    }
  }, [finished, left]);

  const span = endAt - startAt;
  const progress = span > 0 ? Math.min(1, Math.max(0, (now - startAt) / span)) : 1;

  return (
    <div role="timer" aria-live={finished ? 'assertive' : 'off'} className="mb-2">
      <div className={`overflow-hidden rounded-2xl border shadow-2xl ${finished ? 'border-plate bg-[#3a3216]' : 'border-line bg-raised'}`}>
        <div className="h-1 bg-ink">
          <div className="h-full bg-plate transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex items-center gap-2 p-2 pl-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">{finished ? 'Recupero finito' : 'Recupero'}</p>
            <p className={`font-display text-4xl font-bold tabular-nums leading-none ${finished ? 'text-plate' : ''}`}>{fmt(left)}</p>
          </div>
          <button type="button" onClick={() => setEndAt((e) => Math.max(Date.now(), e - 15000))} aria-label="Togli 15 secondi" className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-chalk">
            <Minus className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setEndAt((e) => Math.max(Date.now(), e) + 30000)} aria-label="Aggiungi 30 secondi" className="inline-flex h-12 items-center gap-1 rounded-xl bg-ink px-3 font-semibold text-chalk">
            <Plus className="h-4 w-4" />30s
          </button>
          <button type="button" onClick={onClose} aria-label="Chiudi timer" className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-muted hover:text-chalk">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
