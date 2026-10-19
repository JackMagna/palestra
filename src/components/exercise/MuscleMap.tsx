import Model from 'react-body-highlighter';
import { muscleLabel, toBodyMuscles, type LibraryMuscle } from '../../lib/exerciseLibrary';

interface MuscleMapProps {
  primary: LibraryMuscle[];
  secondary?: LibraryMuscle[];
  /** per la scheda intera: quante volte ogni muscolo è allenato */
  weighted?: { muscles: LibraryMuscle[]; weight: number }[];
  compact?: boolean;
}

const COLORS = ['#7d6a2c', '#c79e2e', '#f0c33c'];

/** Mappa muscolare fronte/retro con react-body-highlighter (MIT). */
export function MuscleMap({ primary, secondary = [], weighted, compact }: MuscleMapProps) {
  const data = weighted
    ? weighted.map((w, i) => ({ name: `g${i}`, muscles: toBodyMuscles(w.muscles), frequency: w.weight }))
    : [
        { name: 'secondari', muscles: toBodyMuscles(secondary), frequency: 1 },
        { name: 'principali', muscles: toBodyMuscles(primary), frequency: 3 }
      ];
  const size = compact ? 'w-[42%] max-w-[150px]' : 'w-[45%] max-w-[200px]';

  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="flex w-full items-start justify-center gap-4">
        {(['anterior', 'posterior'] as const).map((type) => (
          <div key={type} className={size}>
            <Model type={type} data={data as never} bodyColor="#4a4f56" highlightedColors={COLORS} style={{ width: '100%' }} svgStyle={{ width: '100%', height: 'auto' }} />
            <p className="mt-1 text-center text-xs text-faint">{type === 'anterior' ? 'Fronte' : 'Retro'}</p>
          </div>
        ))}
      </div>
      {!weighted && (
        <figcaption className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {primary.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-plate" aria-hidden="true" />
              {primary.map(muscleLabel).join(', ')}
            </span>
          )}
          {secondary.length > 0 && (
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7d6a2c]" aria-hidden="true" />
              {secondary.map(muscleLabel).join(', ')}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
