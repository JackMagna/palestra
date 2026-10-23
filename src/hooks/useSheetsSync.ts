import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Measurement, WorkoutProgram, WorkoutSession } from '../types';
import type { AppDataActions } from './useAppData';
import {
  annotateGrid, appendMeasurements, appendSessions, findMeasuresTab, listTabs, readMeasures, writeMeasureCells
} from '../services/googleSheets';
import { authErrorMessage, withGoogleToken } from '../services/firebase';
import {
  cellA1, inferStartDate, reconcileMeasures, type MeasureConflict, type MeasuresLayout
} from '../lib/measuresSheet';

interface Args {
  user: User | null;
  spreadsheetId: string;
  program: WorkoutProgram;
  sessions: WorkoutSession[];
  measurements: Measurement[];
  actions: AppDataActions;
  notify: (message: string, kind?: 'success' | 'error') => void;
}

export interface MeasuresState {
  /** auth = serve ricollegare Google con un tocco */
  status: 'idle' | 'syncing' | 'ok' | 'error' | 'auth';
  at?: number;
  message?: string;
  conflicts: MeasureConflict[];
}

/**
 * Tiene il foglio Google allineato:
 * - carichi: scheda "Log carichi" e griglia del coach;
 * - misure: scheda MISURE del coach, nei due sensi (colonne = settimane).
 * Parte da solo quando il permesso Google è ancora valido; altrimenti aspetta un tocco.
 */
export function useSheetsSync(args: Args) {
  const latest = useRef(args);
  latest.current = args;
  const busy = useRef(false);
  const busyMeasures = useRef(false);
  const lastFailure = useRef('');
  const layoutRef = useRef<{ tab: string; layout: MeasuresLayout } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [measures, setMeasures] = useState<MeasuresState>({ status: 'idle', conflicts: [] });

  const pendingSessions = args.sessions.filter((s) => s.sheetsSynced === false);
  const pendingMeasurements = args.measurements.filter((m) => m.sheetsSynced === false);
  const pendingCount = pendingSessions.length + pendingMeasurements.length;
  const sessionsKey = pendingSessions.map((s) => s.id).join(',');
  const measuresKey = pendingMeasurements.map((m) => m.id).join(',');

  /* ---------- carichi ---------- */
  const syncSessions = useCallback(async (interactive: boolean) => {
    const a = latest.current;
    const sessions = a.sessions.filter((s) => s.sheetsSynced === false);
    if (!a.user || !a.spreadsheetId || busy.current || !sessions.length) return;
    busy.current = true;
    setSyncing(true);
    try {
      const done = await withGoogleToken(async (token) => {
        const ordered = [...sessions].sort((x, y) => x.startedAt - y.startedAt);
        await appendSessions(token, a.spreadsheetId, ordered);
        return a.program.source?.annotate ? annotateGrid(token, a.spreadsheetId, a.program, ordered) : { written: 0, skipped: 0 };
      }, interactive);
      if (!done) return;
      sessions.forEach((s) => a.actions.updateSession(s.id, { sheetsSynced: true }));
      lastFailure.current = '';
      const extra = done.skipped ? ` ${done.skipped} celle della griglia non sono state toccate perché il coach le ha modificate.` : '';
      a.notify(`Foglio Google aggiornato.${extra}`);
    } catch (err) {
      const key = `${sessions.map((s) => s.id).join(',')}|${err instanceof Error ? err.message : ''}`;
      if (interactive || key !== lastFailure.current) a.notify(authErrorMessage(err), 'error');
      lastFailure.current = key;
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }, []);

  /* ---------- misure ---------- */
  const syncMeasures = useCallback(async (interactive: boolean) => {
    const a = latest.current;
    if (!a.user || !a.spreadsheetId || busyMeasures.current) return;
    busyMeasures.current = true;
    setMeasures((m) => ({ ...m, status: 'syncing' }));
    try {
      const pending = a.measurements.filter((m) => m.sheetsSynced === false);
      const result = await withGoogleToken(async (token) => {
        const tabs = await listTabs(token, a.spreadsheetId);
        const tab = a.program.source?.measuresTab ?? findMeasuresTab(tabs);
        const fallback = async (warning?: string) => {
          await appendMeasurements(token, a.spreadsheetId, pending);
          return { rec: null, warning };
        };
        if (!tab) return fallback('Nel foglio non c\'è una scheda MISURE: le misure vanno in una scheda "Misure app".');
        let parsed: Awaited<ReturnType<typeof readMeasures>>;
        try {
          parsed = await readMeasures(token, a.spreadsheetId, tab);
        } catch (err) {
          return fallback(err instanceof Error ? `${err.message} Uso la scheda "Misure app".` : undefined);
        }
        layoutRef.current = { tab, layout: parsed.layout };
        const rec = reconcileMeasures({
          layout: parsed.layout,
          sheetValues: parsed.values,
          measurements: a.measurements,
          startDate: inferStartDate(a.program, a.sessions),
          totalWeeks: a.program.totalWeeks
        });
        const cells = rec.write.flatMap((w) => {
          const a1 = cellA1(parsed.layout, w.week, w.field);
          return a1 ? [{ a1, value: w.value }] : [];
        });
        await writeMeasureCells(token, a.spreadsheetId, tab, cells);
        return { rec, warning: undefined };
      }, interactive);

      if (!result) {
        setMeasures((m) => ({ ...m, status: 'auth', message: 'Serve ricollegare Google.' }));
        return;
      }
      const { rec, warning } = result;
      rec?.add.forEach((m) => a.actions.addMeasurement(m));
      rec?.fill.forEach((f) => a.actions.updateMeasurement(f.id, f.patch));
      const blocked = new Set((rec?.conflicts ?? []).map((c) => c.measurementId));
      pending.filter((m) => !blocked.has(m.id)).forEach((m) => a.actions.updateMeasurement(m.id, { sheetsSynced: true }));
      setMeasures({ status: 'ok', at: Date.now(), message: warning, conflicts: rec?.conflicts ?? [] });
    } catch (err) {
      const message = authErrorMessage(err);
      setMeasures((m) => ({ ...m, status: 'error', message }));
      if (interactive) latest.current.notify(message, 'error');
    } finally {
      busyMeasures.current = false;
    }
  }, []);

  /** Sceglie quale valore tenere quando foglio e app sono diversi. */
  const resolveConflict = useCallback(async (c: MeasureConflict, choice: 'sheet' | 'app') => {
    const a = latest.current;
    try {
      if (choice === 'sheet') {
        a.actions.updateMeasurement(c.measurementId, { [c.field]: c.sheetValue, sheetsSynced: true });
      } else {
        const ref = layoutRef.current;
        const a1 = ref && cellA1(ref.layout, c.week, c.field);
        if (!ref || !a1) throw new Error('Non trovo la cella da aggiornare: riprova a sincronizzare.');
        const done = await withGoogleToken((t) => writeMeasureCells(t, a.spreadsheetId, ref.tab, [{ a1, value: c.appValue }]).then(() => true), true);
        if (!done) return;
        a.actions.updateMeasurement(c.measurementId, { sheetsSynced: true });
      }
      setMeasures((m) => ({ ...m, conflicts: m.conflicts.filter((x) => !(x.week === c.week && x.field === c.field)) }));
    } catch (err) {
      a.notify(authErrorMessage(err), 'error');
    }
  }, []);

  const syncNow = useCallback(async (interactive: boolean) => {
    await syncSessions(interactive);
    await syncMeasures(interactive);
  }, [syncSessions, syncMeasures]);

  // invio automatico, senza popup
  useEffect(() => {
    if (sessionsKey && args.spreadsheetId && args.user) void syncSessions(false);
  }, [sessionsKey, args.spreadsheetId, args.user, syncSessions]);
  // misure: appena si collega il foglio e a ogni misura nuova
  useEffect(() => {
    if (args.spreadsheetId && args.user) void syncMeasures(false);
  }, [measuresKey, args.spreadsheetId, args.user, syncMeasures]);

  return { pendingCount, syncing, syncNow, measures, syncMeasures, resolveConflict };
}
