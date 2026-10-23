import { useState } from 'react';
import { Copy, ExternalLink, Scale } from 'lucide-react';
import type { HealthApi } from '../../hooks/useHealthSync';
import { isFitbitConfigured, redirectUri } from '../../services/fitbit';
import { isAndroidApp, openHealthConnectSettings } from '../../services/healthConnect';
import type { HealthSource } from '../../services/health';
import { Button } from '../ui/Button';

const OPTIONS: { id: HealthSource; label: string; hint: string }[] = [
  { id: 'none', label: 'Nessuna', hint: 'Non collegare niente' },
  { id: 'fitbit', label: 'Fitbit', hint: 'Funziona anche dal sito' },
  { id: 'healthconnect', label: 'Health Connect', hint: 'Solo nell\'app Android' }
];

/** Scelta della fonte dati salute: Fitbit oppure Health Connect, una per volta. */
export function HealthPanel({ health }: { health: HealthApi }) {
  const [copied, setCopied] = useState(false);
  const android = isAndroidApp();

  return (
    <section className="space-y-3 border-t border-line pt-5">
      <h3 className="font-display text-lg font-semibold">Dati salute</h3>
      <p className="text-sm text-muted">Scegli da dove importare peso, massa grassa e frequenza cardiaca. Le pesate che inserisci nell'app vengono inviate alla stessa fonte.</p>

      <div role="radiogroup" aria-label="Fonte dati salute" className="grid gap-2">
        {OPTIONS.map((o) => {
          const disabled = o.id === 'healthconnect' && !android;
          const active = health.source === o.id;
          return (
            <button
              key={o.id} type="button" role="radio" aria-checked={active} disabled={disabled}
              onClick={() => health.setSource(o.id)}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left disabled:opacity-45 ${active ? 'border-plate bg-plate/10' : 'border-line'}`}
            >
              <span className="font-semibold">{o.label}</span>
              <span className="text-sm text-muted">{disabled ? 'Serve l\'app Android' : o.hint}</span>
            </button>
          );
        })}
      </div>

      {health.source !== 'none' && health.connected && (
        <div className="space-y-3">
          {health.source === 'fitbit' && (
            <label className="flex items-start gap-3 rounded-xl bg-ink p-3">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#f0c33c]" checked={health.autoLog} onChange={(e) => health.setAutoLog(e.target.checked)} />
              <span>
                <span className="block font-semibold">Registra gli allenamenti su Fitbit</span>
                <span className="block text-sm text-muted">Compaiono come “Weights” con durata e calorie; importo la frequenza se l'orologio ha già sincronizzato.</span>
              </span>
            </label>
          )}
          {health.source === 'healthconnect' && <p className="text-sm text-muted">Health Connect è collegato. Gli allenamenti non si possono ancora salvare lì: importo frequenza e peso.</p>}
          <div className="flex flex-wrap gap-2">
            <Button icon={<Scale className="h-4 w-4" />} disabled={health.busy} onClick={health.importBody}>{health.busy ? 'Importo…' : 'Importa pesate (30 giorni)'}</Button>
            {health.source === 'healthconnect' && <Button icon={<ExternalLink className="h-4 w-4" />} onClick={() => void openHealthConnectSettings()}>Permessi</Button>}
            <Button variant="ghost" onClick={health.disconnect}>Scollega</Button>
          </div>
        </div>
      )}

      {health.source !== 'none' && !health.connected && (health.source === 'healthconnect' || isFitbitConfigured()) && (
        <Button variant="primary" onClick={health.connect}>Collega {health.source === 'fitbit' ? 'Fitbit' : 'Health Connect'}</Button>
      )}

      {health.source === 'fitbit' && !health.connected && !isFitbitConfigured() && (
        <div className="space-y-3 text-sm text-muted">
          <p>Per Fitbit serve registrare una piccola app personale (gratis, una volta sola, la fa chi pubblica l'app):</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Vai su <span className="text-chalk">dev.fitbit.com/apps/new</span> e accedi con l'account Fitbit.</li>
            <li>“OAuth 2.0 Application Type”: <span className="text-chalk">Personal</span>. “Default Access Type”: <span className="text-chalk">Read &amp; Write</span>.</li>
            <li>
              “Redirect URL”: <span className="break-all text-chalk">{redirectUri()}</span>{' '}
              <button type="button" className="inline-flex items-center gap-1 text-plate" onClick={() => { void navigator.clipboard?.writeText(redirectUri()); setCopied(true); }}>
                <Copy className="h-3.5 w-3.5" />{copied ? 'Copiato' : 'Copia'}
              </button>
            </li>
            <li>Copia l'“OAuth 2.0 Client ID” e salvalo su Vercel (Settings → Environment Variables) come <span className="text-chalk">VITE_FITBIT_CLIENT_ID</span>, poi fai un nuovo deploy.</li>
          </ol>
        </div>
      )}
    </section>
  );
}
