import type { ProgramDay, WorkoutProgram } from '../../types';
import { SECTION_LABELS } from '../../data/defaultProgram';
import { useLibrary } from '../../hooks/useLibrary';
import type { LibraryMuscle } from '../../lib/exerciseLibrary';
import { MuscleMap } from '../exercise/MuscleMap';

/** La scheda in sola lettura: card su telefono, tabella da tablet in su. */
export function ProgramView({ program, day }: { program: WorkoutProgram; day: ProgramDay }) {
  const { byId } = useLibrary();
  const weeks = Array.from({ length: program.totalWeeks }, (_, i) => i + 1);

  const weighted = day.exercises
    .map((e) => (e.libraryId ? byId.get(e.libraryId) : undefined))
    .filter(Boolean)
    .flatMap((lib) => [
      { muscles: lib!.primaryMuscles as LibraryMuscle[], weight: 2 },
      { muscles: lib!.secondaryMuscles as LibraryMuscle[], weight: 1 }
    ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0">
        {/* Telefono */}
        <ol className="space-y-3 md:hidden">
          {day.exercises.map((ex, i) => (
            <li key={ex.id} className="card p-4">
              <p className="text-sm text-muted">{i + 1}. {SECTION_LABELS[ex.sectionType]} · recupero {ex.restTimeSec}s</p>
              <h3 className="font-display text-xl font-semibold">{ex.name}</h3>
              {ex.note && <p className="mt-1 text-[15px] text-chalk/85">{ex.note}</p>}
              <dl className="mt-3 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
                {weeks.map((w) => (
                  <div key={w} className="rounded-xl bg-ink px-2 py-1.5">
                    <dt className="text-xs text-faint">Sett. {w}</dt>
                    <dd className="text-sm font-semibold break-words">{ex.weeks[w] || '—'}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>

        {/* Tablet e computer */}
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-sm text-muted">
                <th scope="col" className="min-w-[13rem] p-3 font-medium">Esercizio</th>
                {weeks.map((w) => <th key={w} scope="col" className="p-3 font-medium whitespace-nowrap">S{w}</th>)}
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((ex, i) => {
                const newSection = i === 0 || day.exercises[i - 1].sectionType !== ex.sectionType;
                return [
                  newSection && (
                    <tr key={`${ex.id}-s`} className="bg-ink/60">
                      <th colSpan={weeks.length + 1} scope="colgroup" className="px-3 py-2 text-sm font-semibold text-plate">{SECTION_LABELS[ex.sectionType]}</th>
                    </tr>
                  ),
                  <tr key={ex.id} className="border-b border-line/60 align-top last:border-0">
                    <td className="p-3">
                      <span className="block font-semibold">{ex.name}</span>
                      {ex.note && <span className="block text-sm text-muted">{ex.note}</span>}
                    </td>
                    {weeks.map((w) => <td key={w} className={`min-w-[4.5rem] p-3 tabular-nums ${(ex.weeks[w] ?? '').includes(' ') ? '' : 'whitespace-nowrap'}`}>{ex.weeks[w] || '—'}</td>)}
                  </tr>
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>

      {weighted.length > 0 && (
        <aside className="card p-4">
          <h3 className="font-display text-lg font-semibold">Muscoli allenati</h3>
          <p className="mb-3 text-sm text-muted">Più è intenso il colore, più il muscolo lavora in questa giornata.</p>
          <MuscleMap primary={[]} weighted={weighted} compact />
        </aside>
      )}
    </div>
  );
}
