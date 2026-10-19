import { useEffect, useState } from 'react';
import { ImageOff, Pause, Play } from 'lucide-react';
import type { LibraryExercise } from '../../lib/exerciseLibrary';
import { SafeImg } from './SafeImg';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Le foto di free-exercise-db mostrano posizione iniziale e finale.
 * Alternandole si vede il movimento; si può mettere in pausa.
 */
export function ExerciseMedia({ exercise, className = '' }: { exercise?: LibraryExercise; className?: string }) {
  const frames = exercise?.images ?? [];
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFrame(0);
    setFailed(false);
  }, [exercise?.id]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % frames.length), 1100);
    return () => clearInterval(t);
  }, [playing, frames.length]);

  if (!exercise || frames.length === 0 || failed) {
    return (
      <div className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-ink text-faint ${className}`}>
        <ImageOff className="h-6 w-6" />
        <span className="px-6 text-center text-sm">
          {failed ? 'Foto non disponibili: controlla la connessione' : 'Nessuna foto collegata a questo esercizio'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-white ${className}`}>
      {frames.map((path, i) => (
        <SafeImg
          key={path}
          path={path}
          alt={i === 0 ? `${exercise.name}: posizione iniziale` : `${exercise.name}: posizione finale`}
          onFail={() => setFailed(true)}
          eager={i === 0}
          className={`aspect-[4/3] w-full object-contain ${i === frame ? 'relative' : 'absolute inset-0 opacity-0'}`}
        />
      ))}
      {frames.length > 1 && (
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Ferma animazione' : 'Avvia animazione'}
          className="absolute bottom-2 right-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink/85 px-3 text-sm font-medium text-chalk"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {frame === 0 ? 'Inizio' : 'Fine'}
        </button>
      )}
    </div>
  );
}
