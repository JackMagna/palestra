import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ProgramDay, ProgramExercise, WorkoutProgram } from '../../types';
import { SECTION_LABELS } from '../../data/defaultProgram';
import { newId } from '../../lib/ids';
import { Button, IconButton } from '../ui/Button';
import { ExerciseEditor } from './ExerciseEditor';

interface Props {
  value: WorkoutProgram;
  onChange: (p: WorkoutProgram) => void;
  dayId: string;
  onSelectDay: (id: string) => void;
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function ProgramEditor({ value, onChange, dayId, onSelectDay }: Props) {
  const [editing, setEditing] = useState<{ exercise: ProgramExercise; isNew: boolean } | null>(null);
  const dayIndex = Math.max(0, value.days.findIndex((d) => d.id === dayId));
  const day = value.days[dayIndex];

  const updateDay = (patch: Partial<ProgramDay>) =>
    onChange({ ...value, days: value.days.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d)) });

  const addDay = () => {
    const d: ProgramDay = { id: newId('giorno'), title: `Giorno ${value.days.length + 1}`, exercises: [] };
    onChange({ ...value, days: [...value.days, d] });
    onSelectDay(d.id);
  };
  const removeDay = () => {
    if (!window.confirm(`Eliminare ${day.title} e i suoi ${day.exercises.length} esercizi?`)) return;
    const days = value.days.filter((_, i) => i !== dayIndex);
    onChange({ ...value, days });
    onSelectDay(days[Math.max(0, dayIndex - 1)]?.id ?? '');
  };

  const saveExercise = (ex: ProgramExercise) => {
    const exists = day.exercises.some((e) => e.id === ex.id);
    updateDay({ exercises: exists ? day.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...day.exercises, ex] });
    setEditing(null);
  };

  const newExercise = (): ProgramExercise => ({
    id: newId('ex'),
    name: '',
    sectionType: 'progressione',
    restTimeSec: 120,
    weeks: Object.fromEntries(Array.from({ length: value.totalWeeks }, (_, i) => [i + 1, '3X10']))
  });

  return (
    <div className="space-y-6">
      {/* Dati generali */}
      <section className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-title">Nome della scheda</label>
          <input id="p-title" className="field" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="p-ath">Atleta</label>
          <input id="p-ath" className="field" value={value.athlete} onChange={(e) => onChange({ ...value, athlete: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="p-tr">Trainer</label>
          <input id="p-tr" className="field" value={value.trainer} onChange={(e) => onChange({ ...value, trainer: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="p-weeks">Settimane</label>
          <input
            id="p-weeks" className="field" type="number" inputMode="numeric" min={1} max={16}
            value={value.totalWeeks}
            onChange={(e) => onChange({ ...value, totalWeeks: Math.min(16, Math.max(1, Number(e.target.value) || 1)) })}
          />
        </div>
      </section>

      {/* Giornata */}
      {day ? (
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
            <div>
              <label className="label" htmlFor="d-title">Nome del giorno</label>
              <input id="d-title" className="field" value={day.title} onChange={(e) => updateDay({ title: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="d-sub">Descrizione</label>
              <input id="d-sub" className="field" value={day.subtitle ?? ''} onChange={(e) => updateDay({ subtitle: e.target.value })} placeholder="Es. gambe e braccia" />
            </div>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={removeDay}>Elimina giorno</Button>
          </div>

          <ol className="space-y-2">
            {day.exercises.map((ex, i) => (
              <li key={ex.id} className="card flex items-center gap-2 p-2 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{ex.name}</p>
                  <p className="truncate text-sm text-muted">{SECTION_LABELS[ex.sectionType]} · {ex.weeks[1] ?? '—'} · {ex.restTimeSec}s{ex.libraryId ? '' : ' · senza foto'}</p>
                </div>
                <IconButton label="Sposta su" disabled={i === 0} onClick={() => updateDay({ exercises: move(day.exercises, i, i - 1) })}><ArrowUp className="h-4 w-4" /></IconButton>
                <IconButton label="Sposta giù" disabled={i === day.exercises.length - 1} onClick={() => updateDay({ exercises: move(day.exercises, i, i + 1) })}><ArrowDown className="h-4 w-4" /></IconButton>
                <IconButton label={`Modifica ${ex.name}`} onClick={() => setEditing({ exercise: ex, isNew: false })}><Pencil className="h-4 w-4" /></IconButton>
              </li>
            ))}
          </ol>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ exercise: newExercise(), isNew: true })}>Aggiungi esercizio</Button>
        </section>
      ) : (
        <p className="text-muted">Nessun giorno nella scheda.</p>
      )}

      <Button icon={<Plus className="h-4 w-4" />} onClick={addDay}>Aggiungi giorno</Button>

      {/* Linee guida */}
      <section className="card space-y-4 p-4">
        <h2 className="font-display text-xl font-semibold">Indicazioni del trainer</h2>
        <div>
          <label className="label" htmlFor="g-mod">Modalità d'esecuzione (una per riga)</label>
          <textarea
            id="g-mod" rows={3} className="field"
            value={value.guidelines.modalitaEsecuzione.join('\n')}
            onChange={(e) => onChange({ ...value, guidelines: { ...value.guidelines, modalitaEsecuzione: e.target.value.split('\n') } })}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="g-prog">Progressione</label>
            <textarea id="g-prog" rows={2} className="field" value={value.guidelines.progressione} onChange={(e) => onChange({ ...value, guidelines: { ...value.guidelines, progressione: e.target.value } })} />
          </div>
          <div>
            <label className="label" htmlFor="g-ced">Cedimento</label>
            <textarea id="g-ced" rows={2} className="field" value={value.guidelines.cedimento} onChange={(e) => onChange({ ...value, guidelines: { ...value.guidelines, cedimento: e.target.value } })} />
          </div>
        </div>
      </section>

      <ExerciseEditor
        open={!!editing}
        exercise={editing?.exercise ?? null}
        totalWeeks={value.totalWeeks}
        onClose={() => setEditing(null)}
        onSave={saveExercise}
        onDelete={editing && !editing.isNew ? () => {
          updateDay({ exercises: day.exercises.filter((e) => e.id !== editing.exercise.id) });
          setEditing(null);
        } : undefined}
      />
    </div>
  );
}
