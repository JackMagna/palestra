import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Measurement, WorkoutSession } from '../types';
import type { AppDataActions } from './useAppData';
import {
  fetchBody, fetchHeartRate, getPrefs, isFitbitConnected, logWorkout, setPrefs, subscribeFitbit
} from '../services/fitbit';
import { newId } from '../lib/ids';

interface Args {
  sessions: WorkoutSession[];
  measurements: Measurement[];
  actions: AppDataActions;
  hasSheet: boolean;
  notify: (message: string, kind?: 'success' | 'error') => void;
}

/** Registra gli allenamenti su Fitbit, importa frequenza cardiaca e pesate. */
export function useFitbitSync(args: Args) {
  const connected = useSyncExternalStore(subscribeFitbit, isFitbitConnected);
  const autoLog = useSyncExternalStore(subscribeFitbit, () => getPrefs().autoLog);
  const latest = useRef(args);
  latest.current = args;
  const inFlight = useRef(new Set<string>());
  const failed = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);

  const weight = () => [...latest.current.measurements].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.weightKg;

  const syncSession = useCallback(async (s: WorkoutSession, quiet = false) => {
    if (inFlight.current.has(s.id)) return;
    inFlight.current.add(s.id);
    try {
      const patch: Partial<WorkoutSession> = {};
      let current = s;
      if (!s.avgBpm) {
        // la frequenza è un di più: se Fitbit non ce l'ha ancora, si registra comunque l'allenamento
        const hr = await fetchHeartRate(s).catch(() => null);
        if (hr) { patch.avgBpm = hr.avg; patch.maxBpm = hr.max; current = { ...s, ...patch }; }
      }
      patch.fitbitLogId = await logWorkout(current, weight());
      patch.fitbitSynced = true;
      latest.current.actions.updateSession(s.id, patch);
      if (!quiet) latest.current.notify('Allenamento registrato su Fitbit');
    } catch (err) {
      failed.current.add(s.id);
      latest.current.notify(err instanceof Error ? err.message : 'Fitbit non risponde', 'error');
    } finally {
      inFlight.current.delete(s.id);
    }
  }, []);

  // registrazione automatica degli allenamenti appena salvati
  useEffect(() => {
    if (!connected || !autoLog) return;
    args.sessions
      .filter((s) => s.fitbitSynced === false && !failed.current.has(s.id))
      .forEach((s) => void syncSession(s, true));
  }, [args.sessions, connected, autoLog, syncSession]);

  const importHeartRate = useCallback(async (s: WorkoutSession) => {
    setBusy(true);
    try {
      const hr = await fetchHeartRate(s);
      if (!hr) {
        latest.current.notify('Fitbit non ha ancora la frequenza di questo allenamento. Sincronizza l\'orologio e riprova tra qualche minuto.', 'error');
        return;
      }
      latest.current.actions.updateSession(s.id, { avgBpm: hr.avg, maxBpm: hr.max });
      latest.current.notify(`Frequenza importata: ${hr.avg} bpm medi, ${hr.max} massimi`);
    } catch (err) {
      latest.current.notify(err instanceof Error ? err.message : 'Fitbit non risponde', 'error');
    } finally {
      setBusy(false);
    }
  }, []);

  const importBody = useCallback(async () => {
    setBusy(true);
    try {
      const entries = await fetchBody(30);
      const known = latest.current.measurements;
      const fresh = entries.filter((e) => !known.some((m) => m.date === e.date && Math.abs(m.weightKg - e.weightKg) < 0.1));
      fresh.forEach((e) =>
        latest.current.actions.addMeasurement({
          id: newId('m'), date: e.date, weightKg: e.weightKg, bodyFat: e.bodyFat, source: 'Fitbit',
          sheetsSynced: latest.current.hasSheet ? false : undefined
        })
      );
      latest.current.notify(fresh.length ? `Importate ${fresh.length} pesate da Fitbit` : entries.length ? 'Nessuna pesata nuova: hai già tutto.' : 'Fitbit non ha pesate negli ultimi 30 giorni.');
    } catch (err) {
      latest.current.notify(err instanceof Error ? err.message : 'Fitbit non risponde', 'error');
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    connected,
    autoLog,
    busy,
    setAutoLog: (v: boolean) => setPrefs({ autoLog: v }),
    syncSession: (s: WorkoutSession) => { failed.current.delete(s.id); return syncSession(s); },
    importHeartRate,
    importBody
  };
}

export type FitbitApi = ReturnType<typeof useFitbitSync>;
