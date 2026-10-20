import { useEffect, useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import type { ProgramExercise, SectionType } from '../../types';
import { SECTION_LABELS } from '../../data/defaultProgram';
import { describePrescription } from '../../lib/prescription';
import { useLibrary } from '../../hooks/useLibrary';
import { muscleLabel } from '../../lib/exerciseLibrary';
import { SafeImg } from '../exercise/SafeImg';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { LibraryBrowser } from '../exercise/LibraryBrowser';

interface Props {
  open: boolean;
  exercise: ProgramExercise | null;
  totalWeeks: number;
  onClose: () => void;
  onSave: (e: ProgramExercise) => void;
  onDelete?: () => void;
}

const PRESETS: Record<SectionType, string[]> = {
  progressione: ['3X10', '4X10', '3X8 AUMENTO PESO', '4X8', '3X6 AUMENTO PESO', '4X6'],
  cedimento: ['10-9-8..'],
  core: ['4xMAX']
};

export function ExerciseEditor({ open, exercise, totalWeeks, onClose, onSave, onDelete }: Props) {
  const [value, setValue] = useState<ProgramExercise | null>(exercise);
  const [picking, setPicking] = useState(false);
  const { byId } = useLibrary();

  useEffect(() => {
    setValue(exercise);
  }, [exercise]);
  if (!value) return null;

  const set = <K extends keyof ProgramExercise>(k: K, v: ProgramExercise[K]) => setValue({ ...value, [k]: v });
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const linked = value.libraryId ? byId.get(value.libraryId) : undefined;

  const applyPreset = (section: SectionType) => {
    const preset = PRESETS[section];
    set('weeks', Object.fromEntries(weeks.map((w) => [w, preset[Math.min(w - 1, preset.length - 1)]])));
  };
  const fillAll = () => set('weeks', Object.fromEntries(weeks.map((w) => [w, value.weeks[1] ?? ''])));

  return (
    <>
      <Sheet
        open={open && !picking}
        onClose={onClose}
        title={exercise?.name ? 'Modifica esercizio' : 'Nuovo esercizio'}
        size="lg"
        footer={
          <div className="flex flex-wrap gap-2">
            {onDelete && <Button variant="danger" onClick={onDelete}>Elimina</Button>}
            <span className="flex-1" />
            <Button onClick={onClose}>Annulla</Button>
            <Button variant="primary" disabled={!value.name.trim()} onClick={() => onSave({ ...value, name: value.name.trim() })}>Salva esercizio</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="ex-name">Nome</label>
            <input id="ex-name" className="field" value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Es. Pressa 45°" />
          </div>

          <div className="rounded-2xl border border-line p-3">
            <p className="label">Esercizio della libreria (foto e muscoli)</p>
            {linked ? (
              <div className="flex items-center gap-3">
                <span className="h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-ink"><SafeImg path={linked.images[0]} alt="" className="h-full w-full bg-white object-contain" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{linked.name}</p>
                  <p className="truncate text-sm text-muted">{linked.primaryMuscles.map(muscleLabel).join(', ')}</p>
                </div>
                <Button size="sm" icon={<Link2 className="h-4 w-4" />} onClick={() => setPicking(true)}>Cambia</Button>
                <Button size="sm" variant="ghost" aria-label="Scollega" onClick={() => set('libraryId', undefined)}><Unlink className="h-4 w-4" /></Button>
              </div>
            ) : (
              <Button icon={<Link2 className="h-4 w-4" />} onClick={() => setPicking(true)}>Scegli dalla libreria</Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ex-section">Tipo di lavoro</label>
              <select id="ex-section" className="field" value={value.sectionType} onChange={(e) => set('sectionType', e.target.value as SectionType)}>
                {(Object.keys(SECTION_LABELS) as SectionType[]).map((s) => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ex-rest">Recupero (secondi)</label>
              <input id="ex-rest" className="field" type="number" inputMode="numeric" min={0} step={15} value={value.restTimeSec} onChange={(e) => set('restTimeSec', Math.max(0, Number(e.target.value) || 0))} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="ex-note">Nota tecnica</label>
            <textarea id="ex-note" rows={2} className="field" value={value.note ?? ''} onChange={(e) => set('note', e.target.value)} placeholder="Es. gomiti bloccati, discesa lenta" />
          </div>
          <div>
            <label className="label" htmlFor="ex-warm">Riscaldamento</label>
            <input id="ex-warm" className="field" value={value.warmupNote ?? ''} onChange={(e) => set('warmupNote', e.target.value)} placeholder="Es. 2 serie di avvicinamento" />
          </div>

          <fieldset>
            <legend className="label">Serie e ripetizioni per settimana</legend>
            <p className="mb-3 text-sm text-faint">Scrivi come nella scheda del trainer: 3X10, 4X8 AUMENTO PESO, 10-9-8.., 4xMAX.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {weeks.map((w) => (
                <div key={w}>
                  <label className="mb-1 block text-sm text-muted" htmlFor={`wk-${w}`}>Settimana {w}</label>
                  <input
                    id={`wk-${w}`}
                    className="field uppercase"
                    value={value.weeks[w] ?? ''}
                    onChange={(e) => set('weeks', { ...value.weeks, [w]: e.target.value })}
                  />
                  <p className="mt-1 truncate text-xs text-faint">{value.weeks[w] ? describePrescription(value.weeks[w]) : 'vuoto'}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={fillAll}>Copia la settimana 1 su tutte</Button>
              <Button size="sm" onClick={() => applyPreset(value.sectionType)}>Usa schema {SECTION_LABELS[value.sectionType].toLowerCase()}</Button>
            </div>
          </fieldset>
        </div>
      </Sheet>

      <Sheet open={open && picking} onClose={() => setPicking(false)} title="Scegli dalla libreria" size="lg">
        <LibraryBrowser
          dense
          selectedId={value.libraryId}
          onSelect={(e) => { setValue({ ...value, libraryId: e.id }); setPicking(false); }}
        />
      </Sheet>
    </>
  );
}
