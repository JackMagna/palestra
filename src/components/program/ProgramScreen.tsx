import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { WorkoutProgram } from '../../types';
import { DEFAULT_PROGRAM } from '../../data/defaultProgram';
import { Segmented } from '../ui/Segmented';
import { Button } from '../ui/Button';
import { ProgramView } from './ProgramView';
import { ProgramEditor } from './ProgramEditor';
import { SheetsPanel } from './SheetsPanel';
import { CoachSheetImport } from './CoachSheetImport';
import { useToast } from '../ui/Toast';

interface Props {
  user: User | null;
  program: WorkoutProgram;
  spreadsheetId: string;
  onSaveProgram: (p: WorkoutProgram) => void;
  onSetSpreadsheetId: (id: string) => void;
  sync: { pendingCount: number; syncing: boolean; syncNow: (interactive: boolean) => Promise<void> };
  onLogin: () => void;
  startEditing?: boolean;
  onEditingConsumed?: () => void;
}

export function ProgramScreen(props: Props) {
  const { program } = props;
  const toast = useToast();
  const [dayId, setDayId] = useState(program.days[0]?.id ?? '');
  const [draft, setDraft] = useState<WorkoutProgram | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (props.startEditing) {
      setDraft(structuredClone(program));
      props.onEditingConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.startEditing]);

  const shown = draft ?? program;
  const day = shown.days.find((d) => d.id === dayId) ?? shown.days[0];

  const save = () => {
    if (!draft) return;
    const cleaned: WorkoutProgram = {
      ...draft,
      guidelines: { ...draft.guidelines, modalitaEsecuzione: draft.guidelines.modalitaEsecuzione.map((s) => s.trim()).filter(Boolean) }
    };
    props.onSaveProgram(cleaned);
    setDraft(null);
    toast('Scheda salvata');
  };

  const reset = () => {
    if (window.confirm('Sostituire la scheda con quella di partenza (Giacomo con Dario PT)? Gli allenamenti già salvati restano.')) {
      setDraft(structuredClone(DEFAULT_PROGRAM));
      setDayId(DEFAULT_PROGRAM.days[0].id);
    }
  };

  return (
    <div className={`space-y-6 ${draft ? 'pb-40 lg:pb-24' : ''}`}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{shown.title || 'Scheda'}</h1>
          <p className="text-[15px] text-muted">
            {[shown.athlete, shown.trainer && `con ${shown.trainer}`].filter(Boolean).join(' ')} · {shown.totalWeeks} settimane
          </p>
        </div>
        {!draft && <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setDraft(structuredClone(program))}>Modifica scheda</Button>}
      </header>

      {shown.days.length > 0 && (
        <Segmented label="Giorno" value={day?.id ?? ''} onChange={setDayId} options={shown.days.map((d) => ({ value: d.id, label: d.title || 'Senza nome' }))} />
      )}

      {draft ? (
        <ProgramEditor value={draft} onChange={setDraft} dayId={day?.id ?? ''} onSelectDay={setDayId} />
      ) : day ? (
        <>
          {day.subtitle && <p className="-mt-3 text-[15px] text-muted">{day.subtitle}</p>}
          <ProgramView program={program} day={day} />
          {(program.guidelines.modalitaEsecuzione.length > 0 || program.guidelines.progressione || program.guidelines.cedimento) && (
            <section className="card grid gap-4 p-4 sm:p-5 md:grid-cols-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Esecuzione</h2>
                <ul className="mt-1 space-y-1 text-[15px] text-chalk/85">{program.guidelines.modalitaEsecuzione.map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Progressione</h2>
                <p className="mt-1 text-[15px] text-chalk/85">{program.guidelines.progressione}</p>
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Cedimento</h2>
                <p className="mt-1 text-[15px] text-chalk/85">{program.guidelines.cedimento}</p>
              </div>
            </section>
          )}
        </>
      ) : null}

      {!draft && (
        <SheetsPanel
          user={props.user}
          program={program}
          spreadsheetId={props.spreadsheetId}
          onSetSpreadsheetId={props.onSetSpreadsheetId}
          onToggleAnnotate={(on) => program.source && props.onSaveProgram({ ...program, source: { ...program.source, annotate: on } })}
          onOpenImport={() => setImportOpen(true)}
          sync={props.sync}
          onLogin={props.onLogin}
        />
      )}

      <CoachSheetImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        currentProgram={program}
        currentSpreadsheetId={props.spreadsheetId}
        onImport={(next, id) => {
          props.onSetSpreadsheetId(id);
          props.onSaveProgram(next);
          setDayId(next.days[0]?.id ?? '');
          toast('Scheda del coach importata');
        }}
      />

      {draft && (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 border-t border-line bg-ink/95 backdrop-blur lg:bottom-0 lg:left-60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 lg:px-8">
            <Button variant="ghost" onClick={reset}>Ripristina scheda iniziale</Button>
            <span className="flex-1" />
            <Button onClick={() => setDraft(null)}>Annulla</Button>
            <Button variant="primary" onClick={save}>Salva modifiche</Button>
          </div>
        </div>
      )}
    </div>
  );
}
