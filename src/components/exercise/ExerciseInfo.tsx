import { ExternalLink } from 'lucide-react';
import {
  CATEGORY_LABELS, LEVEL_LABELS, equipmentLabel, youtubeSearchUrl, type LibraryExercise
} from '../../lib/exerciseLibrary';
import { ExerciseMedia } from './ExerciseMedia';
import { MuscleMap } from './MuscleMap';

/** Dettaglio di un esercizio della libreria: foto, muscoli, istruzioni. */
export function ExerciseInfo({ exercise, displayName, showMedia = true }: { exercise: LibraryExercise; displayName?: string; showMedia?: boolean }) {
  const facts = [
    equipmentLabel(exercise.equipment),
    CATEGORY_LABELS[exercise.category] ?? exercise.category,
    LEVEL_LABELS[exercise.level],
    exercise.mechanic === 'compound' ? 'Multiarticolare' : exercise.mechanic === 'isolation' ? 'Monoarticolare' : null
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {showMedia && <ExerciseMedia exercise={exercise} />}
      <div className="flex flex-wrap gap-2">
        {facts.map((f) => (
          <span key={f} className="rounded-full border border-line px-3 py-1 text-sm text-muted">{f}</span>
        ))}
      </div>
      <MuscleMap primary={exercise.primaryMuscles} secondary={exercise.secondaryMuscles} />
      {exercise.instructions.length > 0 && (
        <section>
          <h3 className="font-display text-lg font-semibold">Come si esegue</h3>
          <p className="mb-2 text-sm text-faint">Istruzioni originali della libreria, in inglese.</p>
          <ol lang="en" className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-chalk/90">
            {exercise.instructions.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </section>
      )}
      <a
        href={youtubeSearchUrl(displayName || exercise.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[15px] font-medium text-plate hover:underline"
      >
        Cerca un video su YouTube <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
