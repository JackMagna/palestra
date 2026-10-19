import { useState } from 'react';
import { Copy, Scale } from 'lucide-react';
import type { FitbitApi } from '../../hooks/useFitbitSync';
import { disconnectFitbit, isFitbitConfigured, redirectUri, startFitbitLogin } from '../../services/fitbit';
import { Button } from '../ui/Button';

export function FitbitPanel({ fitbit }: { fitbit: FitbitApi }) {
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const configured = isFitbitConfigured();

  const connect = async () => {
    setError('');
    try {
      await startFitbitLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collegamento non riuscito');
    }
  };

  return (
    <section className="space-y-3 border-t border-line pt-5">
      <h3 className="font-display text-lg font-semibold">Fitbit e Google Health</h3>

      {fitbit.connected ? (
        <>
          <p className="text-sm text-muted">Fitbit è collegato. Da Fitbit i dati arrivano anche nell'app Google Health.</p>
          <label className="flex items-start gap-3 rounded-xl bg-ink p-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[#f0c33c]" checked={fitbit.autoLog} onChange={(e) => fitbit.setAutoLog(e.target.checked)} />
            <span>
              <span className="block font-semibold">Registra gli allenamenti su Fitbit</span>
              <span className="block text-sm text-muted">Quando concludi, l'allenamento compare come “Weights” con durata e calorie, e importo la frequenza cardiaca se l'orologio ha già sincronizzato.</span>
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Scale className="h-4 w-4" />} disabled={fitbit.busy} onClick={fitbit.importBody}>{fitbit.busy ? 'Importo…' : 'Importa pesate (30 giorni)'}</Button>
            <Button variant="ghost" onClick={disconnectFitbit}>Scollega Fitbit</Button>
          </div>
        </>
      ) : configured ? (
        <>
          <p className="text-sm text-muted">Collega il tuo account per registrare gli allenamenti, importare la frequenza cardiaca e le pesate.</p>
          <Button variant="primary" onClick={connect}>Collega Fitbit</Button>
        </>
      ) : (
        <div className="space-y-3 text-sm text-muted">
          <p>Per collegare Fitbit serve registrare una piccola app personale (gratis, una volta sola):</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Vai su <span className="text-chalk">dev.fitbit.com/apps/new</span> e accedi con l'account Fitbit.</li>
            <li>“OAuth 2.0 Application Type”: <span className="text-chalk">Personal</span>. “Default Access Type”: <span className="text-chalk">Read &amp; Write</span>.</li>
            <li>
              “Redirect URL”: <span className="break-all text-chalk">{redirectUri()}</span>{' '}
              <button type="button" className="inline-flex items-center gap-1 text-plate" onClick={() => { void navigator.clipboard?.writeText(redirectUri()); setCopied(true); }}>
                <Copy className="h-3.5 w-3.5" />{copied ? 'Copiato' : 'Copia'}
              </button>
            </li>
            <li>Copia l'“OAuth 2.0 Client ID” e salvalo su Vercel (Settings → Environment Variables) con il nome <span className="text-chalk">VITE_FITBIT_CLIENT_ID</span>, poi fai un nuovo deploy.</li>
          </ol>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-stop">{error}</p>}
    </section>
  );
}
