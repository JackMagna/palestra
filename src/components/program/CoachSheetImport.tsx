import { useState } from 'react';
import type { WorkoutProgram } from '../../types';
import { listTabs, parseSpreadsheetId, readTab } from '../../services/googleSheets';
import { authErrorMessage, withGoogleToken } from '../../services/firebase';
import { mergeWithPrevious, parseCoachSheet, type ParsedSheet } from '../../lib/coachSheet';
import { suggestLibraryId } from '../../lib/exerciseMatch';
import { loadLibrary } from '../../lib/exerciseLibrary';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  currentProgram: WorkoutProgram;
  currentSpreadsheetId: string;
  onImport: (program: WorkoutProgram, spreadsheetId: string) => void;
}

/** Legge la scheda del coach dal foglio Google condiviso e la trasforma in scheda dell'app. */
export function CoachSheetImport({ open, onClose, currentProgram, currentSpreadsheetId, onImport }: Props) {
  const [link, setLink] = useState('');
  const [tabs, setTabs] = useState<string[] | null>(null);
  const [tab, setTab] = useState('');
  const [parsed, setParsed] = useState<ParsedSheet | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setTabs(null); setParsed(null); setError(''); };
  const id = parseSpreadsheetId(link || currentSpreadsheetId);

  const fail = (err: unknown) => setError(authErrorMessage(err));

  const loadTabs = async () => {
    reset();
    setBusy(true);
    try {
      const names = await withGoogleToken((t) => listTabs(t, id));
      if (!names) return;
      setTabs(names);
      setSpreadsheetId(id);
      // la prima scheda che non è un log dell'app
      setTab(names.find((n) => !/^(log carichi|misure)$/i.test(n)) ?? names[0]);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const readSheet = async () => {
    setParsed(null);
    setError('');
    setBusy(true);
    try {
      const rows = await withGoogleToken((t) => readTab(t, spreadsheetId, tab));
      if (!rows) return;
      const result = parseCoachSheet(rows, tab);
      const library = await loadLibrary().catch(() => []);
      let program = mergeWithPrevious(result.program, currentProgram);
      program = {
        ...program,
        days: program.days.map((d) => ({
          ...d,
          exercises: d.exercises.map((e) => ({ ...e, libraryId: e.libraryId ?? suggestLibraryId(e.name, library) }))
        }))
      };
      setParsed({ ...result, program });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const matched = parsed?.program.days.flatMap((d) => d.exercises).filter((e) => e.libraryId).length ?? 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Scheda del coach da Google Sheets"
      size="lg"
      footer={
        parsed && (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onClose}>Annulla</Button>
            <Button className="flex-1" variant="primary" onClick={() => { onImport(parsed.program, spreadsheetId); onClose(); reset(); }}>
              Usa questa scheda
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5 text-[15px]">
        <p className="text-muted">
          Incolla il link del foglio che ti ha condiviso il coach. L'app legge giorni, esercizi e settimane e poi scrive lì i tuoi carichi e le misure.
          Il foglio deve essere condiviso con te come <strong className="text-chalk">Editor</strong>.
        </p>

        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void loadTabs(); }}>
          <label className="flex-1">
            <span className="sr-only">Link del foglio</span>
            <input className="field" value={link} onChange={(e) => { setLink(e.target.value); reset(); }} placeholder={currentSpreadsheetId ? 'Foglio già collegato: lascia vuoto per usarlo' : 'https://docs.google.com/spreadsheets/d/…'} />
          </label>
          <Button type="submit" variant="primary" disabled={busy || !id}>{busy && !tabs ? 'Apro il foglio…' : 'Apri foglio'}</Button>
        </form>

        {tabs && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="label">Quale scheda contiene l'allenamento?</span>
              <select className="field" value={tab} onChange={(e) => { setTab(e.target.value); setParsed(null); }}>
                {tabs.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <Button variant="primary" disabled={busy} onClick={readSheet}>{busy ? 'Leggo…' : 'Leggi la scheda'}</Button>
          </div>
        )}

        {error && <p role="alert" className="rounded-xl border border-stop/40 bg-stop/10 p-3 text-stop">{error}</p>}

        {parsed && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-ink p-4">
              <p className="font-display text-xl font-semibold">{parsed.program.title}</p>
              <p className="text-muted">
                {[parsed.program.athlete, parsed.program.trainer && `con ${parsed.program.trainer}`].filter(Boolean).join(' ')} · {parsed.program.days.length} giorni · {parsed.exerciseCount} esercizi · {parsed.program.totalWeeks} settimane
              </p>
              <p className="mt-1 text-sm text-faint">{matched} esercizi su {parsed.exerciseCount} collegati alla libreria (foto e muscoli). Gli altri li colleghi dalla scheda.</p>
            </div>
            {parsed.warnings.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-plate/40 bg-plate/10 p-3 text-sm">{parsed.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            )}
            {parsed.program.days.map((d) => (
              <div key={d.id}>
                <h3 className="font-display text-lg font-semibold">{d.title}</h3>
                <ol className="mt-1 space-y-1 text-sm">
                  {d.exercises.map((e) => (
                    <li key={e.id} className="flex flex-wrap justify-between gap-x-3 rounded-lg bg-panel px-3 py-1.5">
                      <span>{e.name}</span>
                      <span className="tabular-nums text-muted">{e.weeks[1] || '—'}{e.libraryId ? '' : ' · senza foto'}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <p className="text-sm text-muted">Gli allenamenti già salvati restano. La scheda attuale viene sostituita, ma puoi sempre rileggerla dal foglio.</p>
          </div>
        )}
      </div>
    </Sheet>
  );
}
