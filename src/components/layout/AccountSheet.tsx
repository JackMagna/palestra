import { useRef } from 'react';
import { Download, LogIn, LogOut, Smartphone, Upload } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AppData } from '../../hooks/useAppData';
import { useInstallPrompt } from '../../hooks/usePWA';
import { downloadText } from '../../lib/download';
import { todayISO } from '../../lib/ids';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { FitbitPanel } from './FitbitPanel';
import type { FitbitApi } from '../../hooks/useFitbitSync';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  data: AppData;
  onLogin: () => void;
  onLogout: () => void;
  onImport: (raw: unknown) => void;
  fitbit: FitbitApi;
}

export function AccountSheet({ open, onClose, user, data, onLogin, onLogout, onImport, fitbit }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { canInstall, installed, isIOS, install } = useInstallPrompt();

  const exportBackup = () => {
    const { ready: _ready, ...rest } = data;
    downloadText(`irontrack-backup-${todayISO()}.json`, JSON.stringify({ app: 'irontrack', version: 2, ...rest }, null, 2), 'application/json');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Account e dati">
      <div className="space-y-6 text-[15px]">
        <section className="space-y-3">
          {user ? (
            <>
              <p>
                Connesso come <strong>{user.displayName || user.email}</strong>
                {user.email && user.displayName && <span className="block text-sm text-muted">{user.email}</span>}
              </p>
              <p className="text-sm text-muted">I dati sono salvati nel cloud e sincronizzati tra i tuoi dispositivi.</p>
              <Button icon={<LogOut className="h-4 w-4" />} onClick={onLogout}>Esci</Button>
            </>
          ) : (
            <>
              <p className="text-muted">Stai usando l'app senza account: i dati sono solo su questo dispositivo.</p>
              <Button variant="primary" icon={<LogIn className="h-4 w-4" />} onClick={onLogin}>Accedi con Google</Button>
            </>
          )}
        </section>

        <FitbitPanel fitbit={fitbit} />

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="font-display text-lg font-semibold">Backup</h3>
          <p className="text-sm text-muted">Un file con scheda, allenamenti e misure. Puoi reimportarlo su un altro dispositivo.</p>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Download className="h-4 w-4" />} onClick={exportBackup}>Esporta backup</Button>
            <Button icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Importa backup</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  onImport(JSON.parse(await file.text()));
                } catch {
                  onImport(null);
                }
              }}
            />
          </div>
        </section>

        <p className="border-t border-line pt-4 text-sm text-faint">Versione dell'app: {typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'sviluppo'}</p>

        {!installed && (
          <section className="space-y-3 border-t border-line pt-5">
            <h3 className="font-display text-lg font-semibold">Installa l'app</h3>
            {canInstall ? (
              <Button icon={<Smartphone className="h-4 w-4" />} onClick={install}>Installa sul dispositivo</Button>
            ) : isIOS ? (
              <p className="text-muted">Su iPhone: in Safari tocca Condividi, poi “Aggiungi alla schermata Home”.</p>
            ) : (
              <p className="text-muted">Dal menu del browser scegli “Installa app” o “Aggiungi a schermata Home”.</p>
            )}
          </section>
        )}
      </div>
    </Sheet>
  );
}
