import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { connectHeartRate, isHeartRateSupported, type HeartRateConnection } from '../../services/heartRate';

interface Props {
  open: boolean;
  onClose: () => void;
  bpm: number | null;
  connection: HeartRateConnection | null;
  onConnected: (c: HeartRateConnection) => void;
  onBpm: (bpm: number) => void;
  onDisconnected: () => void;
}

export function HeartRateSheet({ open, onClose, bpm, connection, onConnected, onBpm, onDisconnected }: Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const supported = isHeartRateSupported();

  const connect = async () => {
    setError('');
    setBusy(true);
    try {
      onConnected(await connectHeartRate(onBpm, onDisconnected));
    } catch (err) {
      const name = (err as { name?: string }).name;
      setError(name === 'NotFoundError' ? 'Nessun sensore selezionato.' : err instanceof Error ? err.message : 'Connessione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Frequenza cardiaca">
      <div className="space-y-4 text-[15px]">
        {connection ? (
          <div className="flex items-center gap-4 rounded-2xl bg-ink p-4">
            <Heart className="h-8 w-8 text-stop" />
            <div>
              <p className="font-display text-4xl font-bold tabular-nums">{bpm ?? '–'} <span className="text-lg text-muted">bpm</span></p>
              <p className="text-sm text-muted">{connection.deviceName}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted">
            Collega una fascia cardio o un orologio che trasmette la frequenza via Bluetooth (per esempio Garmin con
            “Trasmetti frequenza cardiaca”, Polar, Coros). Media e massima vengono salvate con l'allenamento.
          </p>
        )}
        {!supported && (
          <p className="rounded-xl border border-line p-3 text-muted">
            Questo browser non supporta il Bluetooth. Funziona con Chrome su Android e su computer; non su iPhone. L'Apple Watch non trasmette la frequenza in Bluetooth.
          </p>
        )}
        {error && <p className="text-stop">{error}</p>}
        {connection ? (
          <Button block variant="danger" onClick={() => { connection.disconnect(); onDisconnected(); }}>Scollega sensore</Button>
        ) : (
          <Button block variant="primary" disabled={!supported || busy} onClick={connect}>{busy ? 'Ricerca in corso…' : 'Cerca sensore'}</Button>
        )}
      </div>
    </Sheet>
  );
}
