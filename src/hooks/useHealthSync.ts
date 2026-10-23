import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Measurement, WorkoutSession } from '../types';
import type { AppDataActions } from './useAppData';
import type { BodyEntry } from '../lib/fitbitMath';
import { newId } from '../lib/ids';
import { getHealthSource, SOURCE_LABEL, setHealthSource, subscribeHealth, type HealthSource } from '../services/health';
import {
  disconnectFitbit, fetchBody, fetchHeartRate, getPrefs, isFitbitConnected, logBody, logWorkout, setPrefs, startFitbitLogin, subscribeFitbit
} from '../services/fitbit';
import {
  connectHealthConnect, disconnectHealthConnect, isHealthConnectConnected, readBody, readHeartRate, writeBody
} from '../services/healthConnect';

interface Args {
  sessions: WorkoutSession[];
  measurements: Measurement[];
  actions: AppDataActions;
  hasSheet: boolean;
  notify: (message: string, kind?: 'success' | 'error') => void;
}

type Ops = {
  heartRate: (s: WorkoutSession) => Promise<{ avg: number; max: number } | null>;
  readBody: () => Promise<BodyEntry[]>;
  writeBody: (e: BodyEntry) => Promise<void>;
};
const OPS: Record<Exclude<HealthSource, 'none'>, Ops> = {
  fitbit: { heartRate: fetchHeartRate, readBody: () => fetchBody(30), writeBody: logBody },
  healthconnect: { heartRate: readHeartRate, readBody: () => readBody(30), writeBody }
};

/**
 * Peso, massa grassa e frequenza cardiaca da Fitbit oppure da Health Connect (una fonte per volta).
 * Solo Fitbit può anche registrare l'allenamento.
 */
export function useHealthSync(args: Args) {
  const source = useSyncExternalStore(subscribeHealth, getHealthSource);
  const fitbitConnected = useSyncExternalStore(subscribeFitbit, isFitbitConnected);
  const hcConnected = useSyncExternalStore(subscribeHealth, isHealthConnectConnected);
  const autoLog = useSyncExternalStore(subscribeFitbit, () => getPrefs().autoLog);
  const connected = source === 'fitbit' ? fitbitConnected : source === 'healthconnect' ? hcConnected : false;

  const latest = useRef(args);
  latest.current = args;
  const inFlight = useRef(new Set<string>());
  const failed = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);
  const ops = source === 'none' ? null : OPS[source];
  const fail = (err: unknown) => latest.current.notify(err instanceof Error ? err.message : 'La fonte dati non risponde', 'error');
  const lastWeight = () => [...latest.current.measurements].filter((m) => m.weightKg !== undefined).sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.weightKg;

  /* ---- allenamento su Fitbit (Health Connect non lo supporta) ---- */
  const syncSession = useCallback(async (s: WorkoutSession, quiet = false) => {
    if (inFlight.current.has(s.id)) return;
    inFlight.current.add(s.id);
    try {
      const patch: Partial<WorkoutSession> = {};
      let current = s;
      if (!s.avgBpm) {
        const hr = await fetchHeartRate(s).catch(() => null); // la frequenza è un di più
        if (hr) { patch.avgBpm = hr.avg; patch.maxBpm = hr.max; current = { ...s, ...patch }; }
      }
      patch.fitbitLogId = await logWorkout(current, lastWeight());
      patch.fitbitSynced = true;
      latest.current.actions.updateSession(s.id, patch);
      if (!quiet) latest.current.notify('Allenamento registrato su Fitbit');
    } catch (err) {
      failed.current.add(s.id);
      fail(err);
    } finally {
      inFlight.current.delete(s.id);
    }
  }, []);

  useEffect(() => {
    if (source !== 'fitbit' || !fitbitConnected || !autoLog) return;
    args.sessions.filter((s) => s.fitbitSynced === false && !failed.current.has(s.id)).forEach((s) => void syncSession(s, true));
  }, [args.sessions, source, fitbitConnected, autoLog, syncSession]);

  /* ---- misure dell'app verso la fonte dati ---- */
  useEffect(() => {
    if (!ops || !connected) return;
    args.measurements
      .filter((m) => m.healthSynced === false && !inFlight.current.has(m.id) && !failed.current.has(m.id))
      .forEach(async (m) => {
        inFlight.current.add(m.id);
        try {
          if (m.weightKg !== undefined || m.bodyFat !== undefined) await ops.writeBody({ date: m.date, weightKg: m.weightKg, bodyFat: m.bodyFat });
          latest.current.actions.updateMeasurement(m.id, { healthSynced: true });
        } catch (err) {
          failed.current.add(m.id);
          fail(err);
        } finally {
          inFlight.current.delete(m.id);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.measurements, source, connected]);

  const importHeartRate = useCallback(async (s: WorkoutSession) => {
    if (!ops) return;
    setBusy(true);
    try {
      const hr = await ops.heartRate(s);
      if (!hr) {
        latest.current.notify('Non ci sono ancora dati di frequenza per questo allenamento. Sincronizza l\'orologio e riprova tra qualche minuto.', 'error');
        return;
      }
      latest.current.actions.updateSession(s.id, { avgBpm: hr.avg, maxBpm: hr.max });
      latest.current.notify(`Frequenza importata: ${hr.avg} bpm medi, ${hr.max} massimi`);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const importBody = useCallback(async () => {
    if (!ops || source === 'none') return;
    setBusy(true);
    try {
      const entries = await ops.readBody();
      const known = latest.current.measurements;
      const fresh = entries.filter((e) => !known.some((m) => m.date === e.date && (e.weightKg === undefined || m.weightKg === undefined || Math.abs(m.weightKg - e.weightKg) < 0.1)));
      fresh.forEach((e) =>
        latest.current.actions.addMeasurement({
          id: newId('m'), date: e.date, weightKg: e.weightKg, bodyFat: e.bodyFat, source: SOURCE_LABEL[source],
          healthSynced: true, sheetsSynced: latest.current.hasSheet ? false : undefined
        })
      );
      latest.current.notify(fresh.length ? `Importate ${fresh.length} pesate da ${SOURCE_LABEL[source]}` : entries.length ? 'Nessuna pesata nuova: hai già tutto.' : `${SOURCE_LABEL[source]} non ha pesate negli ultimi 30 giorni.`);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const connect = useCallback(async () => {
    try {
      if (source === 'fitbit') await startFitbitLogin();
      else if (source === 'healthconnect') { await connectHealthConnect(); latest.current.notify('Health Connect collegato'); }
    } catch (err) {
      fail(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  return {
    source,
    setSource: setHealthSource,
    connected,
    autoLog,
    busy,
    connect,
    disconnect: () => (source === 'fitbit' ? disconnectFitbit() : disconnectHealthConnect()),
    setAutoLog: (v: boolean) => setPrefs({ autoLog: v }),
    syncSession: (s: WorkoutSession) => { failed.current.delete(s.id); return syncSession(s); },
    importHeartRate,
    importBody
  };
}

export type HealthApi = ReturnType<typeof useHealthSync>;
