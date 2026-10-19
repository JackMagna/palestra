import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Measurement, WorkoutProgram, WorkoutSession } from '../types';
import type { AppDataActions } from './useAppData';
import { annotateGrid, appendMeasurements, appendSessions } from '../services/googleSheets';
import { authErrorMessage, withGoogleToken } from '../services/firebase';

interface Args {
  user: User | null;
  spreadsheetId: string;
  program: WorkoutProgram;
  sessions: WorkoutSession[];
  measurements: Measurement[];
  actions: AppDataActions;
  notify: (message: string, kind?: 'success' | 'error') => void;
}

/**
 * Tiene il foglio Google allineato: carichi (scheda "Log carichi" e griglia del coach) e misure.
 * Parte da solo quando il permesso Google è ancora valido; altrimenti aspetta un tocco su "Invia".
 */
export function useSheetsSync(args: Args) {
  const latest = useRef(args);
  latest.current = args;
  const busy = useRef(false);
  const lastFailure = useRef('');
  const [syncing, setSyncing] = useState(false);

  const pendingSessions = args.sessions.filter((s) => s.sheetsSynced === false);
  const pendingMeasurements = args.measurements.filter((m) => m.sheetsSynced === false);
  const pendingCount = pendingSessions.length + pendingMeasurements.length;
  const pendingKey = [...pendingSessions.map((s) => s.id), ...pendingMeasurements.map((m) => m.id)].join(',');

  const syncNow = useCallback(async (interactive: boolean) => {
    const a = latest.current;
    const sessions = a.sessions.filter((s) => s.sheetsSynced === false);
    const measurements = a.measurements.filter((m) => m.sheetsSynced === false);
    if (!a.user || !a.spreadsheetId || busy.current || (!sessions.length && !measurements.length)) return;
    busy.current = true;
    setSyncing(true);
    try {
      const done = await withGoogleToken(async (token) => {
        const ordered = [...sessions].sort((x, y) => x.startedAt - y.startedAt);
        await appendSessions(token, a.spreadsheetId, ordered);
        const grid = a.program.source?.annotate ? await annotateGrid(token, a.spreadsheetId, a.program, ordered) : { written: 0, skipped: 0 };
        await appendMeasurements(token, a.spreadsheetId, measurements);
        return grid;
      }, interactive);
      if (!done) return;
      sessions.forEach((s) => a.actions.updateSession(s.id, { sheetsSynced: true }));
      measurements.forEach((m) => a.actions.updateMeasurement(m.id, { sheetsSynced: true }));
      lastFailure.current = '';
      const extra = done.skipped ? ` ${done.skipped} celle della griglia non sono state toccate perché il coach le ha modificate.` : '';
      a.notify(`Foglio Google aggiornato.${extra}`);
    } catch (err) {
      const key = `${pendingKeyOf(sessions, measurements)}|${err instanceof Error ? err.message : ''}`;
      if (interactive || key !== lastFailure.current) a.notify(authErrorMessage(err), 'error');
      lastFailure.current = key;
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }, []);

  // sincronizzazione automatica, senza popup
  useEffect(() => {
    if (pendingCount > 0 && args.spreadsheetId && args.user) void syncNow(false);
  }, [pendingKey, args.spreadsheetId, args.user, pendingCount, syncNow]);

  return { pendingCount, syncing, syncNow };
}

const pendingKeyOf = (s: WorkoutSession[], m: Measurement[]) => [...s.map((x) => x.id), ...m.map((x) => x.id)].join(',');
