import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LibraryExercise } from '../../lib/exerciseLibrary';
import { ExerciseMedia } from '../exercise/ExerciseMedia';
import { ExerciseInfo } from '../exercise/ExerciseInfo';
import { MuscleMap } from '../exercise/MuscleMap';
import { Sheet } from '../ui/Sheet';

/** Foto e muscoli dell'esercizio. Su telefono è compresso sotto i comandi. */
export function ExerciseAside({ exercise, name, collapsible }: { exercise?: LibraryExercise; name: string; collapsible: boolean }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);

  const body = (
    <div className="space-y-4">
      <ExerciseMedia exercise={exercise} />
      {exercise && (
        <>
          <MuscleMap primary={exercise.primaryMuscles} secondary={exercise.secondaryMuscles} compact />
          <button type="button" onClick={() => setDetails(true)} className="text-[15px] font-medium text-plate hover:underline">
            Istruzioni e dettagli
          </button>
        </>
      )}
      {!exercise && (
        <p className="text-sm text-muted">Collega questo esercizio a uno della libreria dalla scheda per vedere foto e muscoli.</p>
      )}
      <Sheet open={details && !!exercise} onClose={() => setDetails(false)} title={name} size="lg">
        {exercise && <ExerciseInfo exercise={exercise} displayName={name} showMedia={false} />}
      </Sheet>
    </div>
  );

  if (!collapsible) return <aside aria-label="Come si esegue">{body}</aside>;

  return (
    <aside aria-label="Come si esegue" className="card">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span>
          <span className="block font-display text-lg font-semibold">Come si esegue</span>
          <span className="block text-sm text-muted">{exercise ? exercise.name : 'Nessun esercizio collegato'}</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{body}</div>}
    </aside>
  );
}
