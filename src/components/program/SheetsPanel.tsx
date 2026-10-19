import { useState } from 'react';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { WorkoutProgram } from '../../types';
import { createSpreadsheetFromProgram, spreadsheetUrl } from '../../services/googleSheets';
import { authErrorMessage, withGoogleToken } from '../../services/firebase';
import { programCSV } from '../../lib/csv';
import { downloadText } from '../../lib/download';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface Props {
  user: User | null;
  program: WorkoutProgram;
  spreadsheetId: string;
  onSetSpreadsheetId: (id: string) => void;
  onToggleAnnotate: (on: boolean) => void;
  onOpenImport: () => void;
  sync: { pendingCount: number; syncing: boolean; syncNow: (interactive: boolean) => Promise<void> };
  onLogin: () => void;
}

/** Il foglio Google condiviso con il coach: qui si legge la scheda e si scrivono carichi e misure. */
export function SheetsPanel({ user, program, spreadsheetId, onSetSpreadsheetId, onToggleAnnotate, onOpenImport, sync, onLogin }: Props) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      const res = await withGoogleToken((t) => createSpreadsheetFromProgram(t, program));
      if (res) { onSetSpreadsheetId(res.spreadsheetId); toast('Foglio creato su Google Drive'); }
    } catch (err) {
      toast(authErrorMessage(err), 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="card space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Foglio del coach (Google Sheets)</h2>
        <p className="max-w-prose text-[15px] text-muted">
          Leggi la scheda dal foglio condiviso e compilala dall'app: i carichi finiscono accanto alla prescrizione di ogni settimana, e le misure in una scheda “Misure” dello stesso foglio.
        </p>
      </div>

      {!user ? (
        <Button variant="primary" onClick={onLogin}>Accedi con Google</Button>
      ) : !spreadsheetId ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onOpenImport}>Collega la scheda del coach</Button>
          <Button disabled={creating} onClick={create}>{creating ? 'Creo il foglio…' : 'Crea un foglio nuovo dalla mia scheda'}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <a href={spreadsheetUrl(spreadsheetId)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-raised px-4 font-semibold">
              Apri il foglio <ExternalLink className="h-4 w-4" />
            </a>
            <Button variant={sync.pendingCount ? 'primary' : 'secondary'} disabled={!sync.pendingCount || sync.syncing} icon={<RefreshCw className={`h-4 w-4 ${sync.syncing ? 'animate-spin' : ''}`} />} onClick={() => sync.syncNow(true)}>
              {sync.pendingCount ? `Invia ${sync.pendingCount} ${sync.pendingCount === 1 ? 'aggiornamento' : 'aggiornamenti'}` : 'Tutto aggiornato'}
            </Button>
            <Button onClick={onOpenImport}>Rileggi la scheda dal foglio</Button>
            <Button variant="ghost" onClick={() => onSetSpreadsheetId('')}>Scollega</Button>
          </div>

          {program.source && (
            <label className="flex items-start gap-3 rounded-xl bg-ink p-3 text-[15px]">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#f0c33c]" checked={program.source.annotate} onChange={(e) => onToggleAnnotate(e.target.checked)} />
              <span>
                <span className="block font-semibold">Scrivi i carichi nella scheda del coach</span>
                <span className="block text-sm text-muted">
                  Accanto a “3X10” nella cella della settimana compare “3X10 · 40 kg”. Se il coach modifica una cella, l'app non la tocca più.
                </span>
              </span>
            </label>
          )}
          <p className="text-sm text-faint">
            L'invio parte da solo quando il permesso Google è attivo (dura circa un'ora); altrimenti tocca “Invia”. Le schede “Log carichi” e “Misure” le crea l'app, il resto del foglio non viene toccato.
          </p>
        </div>
      )}

      <Button variant="ghost" icon={<Download className="h-4 w-4" />} onClick={() => downloadText(`${program.title}.csv`, programCSV(program), 'text/csv;charset=utf-8')}>
        Scarica la scheda in CSV
      </Button>
    </section>
  );
}
