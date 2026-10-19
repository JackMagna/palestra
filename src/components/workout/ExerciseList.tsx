import { Check } from 'lucide-react';
import type { ProgramExercise, SetLog } from '../../types';

interface Props {
  exercises: ProgramExercise[];
  sets: Record<string, SetLog[]>;
  activeIndex: number;
  onSelect: (i: number) => void;
  layout: 'row' | 'column';
}

export function ExerciseList({ exercises, sets, activeIndex, onSelect, layout }: Props) {
  return (
    <nav aria-label="Esercizi della giornata">
      <ol className={layout === 'row' ? 'no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0' : 'space-y-1.5'}>
        {exercises.map((ex, i) => {
          const list = sets[ex.id] ?? [];
          const doneCount = list.filter((s) => s.completed).length;
          const done = list.length > 0 && doneCount === list.length;
          const active = i === activeIndex;
          return (
            <li key={ex.id} className={layout === 'row' ? 'shrink-0' : ''}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? 'step' : undefined}
                className={`flex items-center gap-2.5 rounded-xl border text-left transition ${
                  layout === 'row' ? 'h-11 max-w-[15rem] px-3' : 'w-full px-3 py-2.5'
                } ${active ? 'border-plate bg-plate/10 text-chalk' : done ? 'border-go/40 text-muted' : 'border-line text-muted hover:text-chalk'}`}
              >
                <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? 'bg-go text-[#0d2418]' : active ? 'bg-plate text-plate-ink' : 'bg-raised'}`}>
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{ex.name}</span>
                  {layout === 'column' && <span className="block text-sm text-faint">{doneCount}/{list.length} serie</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
