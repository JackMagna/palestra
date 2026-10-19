import type { ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { ProgramExercise, SetEntry, SetLog } from '../../types';
import { describePrescription, parsePrescription } from '../../lib/prescription';
import { formatKg } from '../../lib/ids';
import { SECTION_LABELS } from '../../data/defaultProgram';
import { NumberStepper } from './NumberStepper';
import { Button } from '../ui/Button';

interface Props {
  exercise: ProgramExercise;
  week: number;
  sets: SetLog[];
  setIndex: number;
  lastTime: SetEntry[];
  onSelectSet: (i: number) => void;
  onChange: (i: number, patch: Partial<SetLog>) => void;
  onComplete: () => void;
  onAddSet: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position: string;
  /** timer di recupero: sta sopra il pulsante, senza coprire nulla */
  restSlot?: ReactNode;
}

export function SetLogger({ exercise, week, sets, setIndex, lastTime, onSelectSet, onChange, onComplete, onAddSet, onPrev, onNext, position, restSlot }: Props) {
  const current = sets[setIndex];
  const prescription = exercise.weeks[week];
  const p = parsePrescription(prescription);
  const allDone = sets.length > 0 && sets.every((s) => s.completed);

  const lastSummary = lastTime.length
    ? lastTime.map((s) => `${formatKg(s.weightKg)}×${s.reps}`).join('  ')
    : null;

  return (
    <section aria-labelledby="exercise-title" className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{position}</span>
          <span aria-hidden="true">·</span>
          <span>{SECTION_LABELS[exercise.sectionType]}</span>
          <span aria-hidden="true">·</span>
          <span>Recupero {exercise.restTimeSec >= 60 ? `${Math.round((exercise.restTimeSec / 60) * 10) / 10} min` : `${exercise.restTimeSec} s`}</span>
        </div>
        <h2 id="exercise-title" className="font-display text-2xl font-bold leading-tight sm:text-4xl">{exercise.name}</h2>
        <p className="text-lg">
          <span className="font-semibold text-plate">{prescription || '—'}</span>
          {prescription && <span className="text-muted"> ({describePrescription(prescription)})</span>}
        </p>
        {exercise.note && <p className="text-[15px] text-chalk/90">{exercise.note}</p>}
        {exercise.warmupNote && <p className="text-sm text-muted">Prima: {exercise.warmupNote}</p>}
        {lastSummary && <p className="text-sm text-muted">Ultima volta: <span className="tabular-nums text-chalk/80">{lastSummary}</span></p>}
      </header>

      <div role="tablist" aria-label="Serie" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {sets.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === setIndex}
            onClick={() => onSelectSet(i)}
            className={`flex h-14 min-w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-xl border px-2 transition ${
              i === setIndex ? 'border-chalk bg-chalk text-ink' : s.completed ? 'border-go/50 text-go' : 'border-line text-muted'
            }`}
          >
            <span className="text-sm font-semibold">Serie {i + 1}</span>
            <span className="text-xs tabular-nums">{s.completed ? `${formatKg(s.weightKg)}×${s.reps}` : `${formatKg(s.weightKg)} kg`}</span>
          </button>
        ))}
        <button type="button" onClick={onAddSet} className="h-14 shrink-0 rounded-xl border border-dashed border-line px-3 text-sm text-muted hover:text-chalk">
          + Serie
        </button>
      </div>

      {current && (
        <div className="space-y-3">
          <NumberStepper label={`Carico, serie ${setIndex + 1}`} unit="kg" value={current.weightKg} decimals steps={[2.5, 5, 10]} onChange={(v) => onChange(setIndex, { weightKg: v })} />
          <NumberStepper label={p.isMax ? 'Ripetizioni (al massimo)' : 'Ripetizioni'} unit="rip" value={current.reps} min={1} steps={[1]} size="lg" onChange={(v) => onChange(setIndex, { reps: v })} />
          {/* Resta sempre visibile sopra le barre in basso mentre si scorre */}
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+8.25rem)] z-20 -mx-4 bg-gradient-to-t from-ink from-70% to-transparent px-4 pb-1 pt-4 lg:bottom-[5.25rem]">
            {restSlot}
            <Button
              block
              size="lg"
              variant={current.completed ? 'secondary' : 'primary'}
              icon={current.completed ? <RotateCcw className="h-5 w-5" /> : <Check className="h-6 w-6" strokeWidth={3} />}
              onClick={onComplete}
              className="h-16 font-display text-xl shadow-lg shadow-black/40"
            >
              {current.completed ? `Serie ${setIndex + 1} fatta: aggiorna` : `Completa serie ${setIndex + 1}`}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button className="flex-1" icon={<ChevronLeft className="h-5 w-5" />} disabled={!onPrev} onClick={onPrev}>Precedente</Button>
        <Button className="flex-1" variant={allDone ? 'primary' : 'secondary'} disabled={!onNext} onClick={onNext}>
          Successivo <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
