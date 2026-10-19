import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Measurement, WorkoutProgram, WorkoutSession } from '../types';
import { normalizeMeasurement, normalizeProgram, normalizeSession } from '../services/normalize';
import { clearLocalData, hasLocalActivity, loadLocalData, saveLocalData, type LocalData } from '../services/localStore';

export interface AppData {
  ready: boolean;
  program: WorkoutProgram;
  sessions: WorkoutSession[];
  measurements: Measurement[];
  spreadsheetId: string;
}

export interface AppDataActions {
  saveProgram(p: WorkoutProgram): void;
  addSession(s: WorkoutSession): void;
  updateSession(id: string, patch: Partial<WorkoutSession>): void;
  deleteSession(id: string): void;
  addMeasurement(m: Measurement): void;
  updateMeasurement(id: string, patch: Partial<Measurement>): void;
  deleteMeasurement(id: string): void;
  setSpreadsheetId(id: string): void;
  importAll(data: Omit<AppData, 'ready'>): Promise<void>;
}

const sortSessions = (a: WorkoutSession, b: WorkoutSession) => b.startedAt - a.startedAt;
const sortMeasurements = (a: Measurement, b: Measurement) => a.date.localeCompare(b.date);

/**
 * Unica fonte dei dati dell'app.
 * - Con account Google: Firestore (con cache offline), condiviso tra dispositivi.
 * - Senza account: localStorage sul dispositivo.
 * Al primo accesso con Google, i dati locali vengono caricati nel cloud.
 */
export function useAppData(user: User | null, onError: (msg: string) => void): [AppData, AppDataActions] {
  const [data, setData] = useState<AppData>(() => ({ ready: false, ...loadLocalData() }));
  const uid = user?.uid ?? null;
  const errorRef = useRef(onError);
  errorRef.current = onError;
  const fail = useCallback((what: string) => (err: unknown) => {
    console.error(what, err);
    errorRef.current(`${what}: ${err instanceof Error ? err.message : 'errore sconosciuto'}`);
  }, []);

  /* ---------- Modalità ospite ---------- */
  useEffect(() => {
    if (uid) return;
    setData({ ready: true, ...loadLocalData() });
  }, [uid]);

  /* ---------- Modalità cloud ---------- */
  useEffect(() => {
    if (!uid) return;
    setData((d) => ({ ...d, ready: false }));
    const userRef = doc(db, 'users', uid);
    let cancelled = false;

    // Migrazione dei dati locali (anche quelli della versione precedente)
    (async () => {
      const local = loadLocalData();
      try {
        const snap = await getDoc(userRef);
        if (cancelled) return;
        const remote = snap.data();
        const needsProgram = !remote?.program;
        if (needsProgram || hasLocalActivity(local)) {
          const batch = writeBatch(db);
          batch.set(
            userRef,
            {
              ...(needsProgram ? { program: local.program } : {}),
              ...(!remote?.spreadsheetId && local.spreadsheetId ? { spreadsheetId: local.spreadsheetId } : {}),
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          local.sessions.forEach((s) => batch.set(doc(db, 'users', uid, 'sessions', s.id), { ...s, userId: uid }));
          local.measurements.forEach((m) => batch.set(doc(db, 'users', uid, 'measurements', m.id), { ...m, userId: uid }));
          await batch.commit();
          clearLocalData();
        }
      } catch (err) {
        fail('Sincronizzazione iniziale non riuscita')(err);
      }
    })();

    const unsubs = [
      onSnapshot(
        userRef,
        (snap) => {
          const d = snap.data();
          setData((prev) => ({
            ...prev,
            ready: true,
            program: d?.program ? normalizeProgram(d.program) : prev.program,
            spreadsheetId: typeof d?.spreadsheetId === 'string' ? d.spreadsheetId : ''
          }));
        },
        fail('Lettura del profilo non riuscita')
      ),
      onSnapshot(
        collection(db, 'users', uid, 'sessions'),
        (snap) => {
          const sessions = snap.docs.map((d) => normalizeSession(d.data(), d.id)).sort(sortSessions);
          setData((prev) => ({ ...prev, sessions }));
        },
        fail('Lettura degli allenamenti non riuscita')
      ),
      onSnapshot(
        collection(db, 'users', uid, 'measurements'),
        (snap) => {
          const measurements = snap.docs.map((d) => normalizeMeasurement(d.data(), d.id)).sort(sortMeasurements);
          setData((prev) => ({ ...prev, measurements }));
        },
        fail('Lettura delle misure non riuscita')
      )
    ];
    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [uid, fail]);

  /* ---------- Azioni ----------
   * Le scritture su Firestore non vengono attese: con la cache offline la
   * promessa si risolve solo quando il server conferma, ma lo stato locale
   * si aggiorna subito tramite onSnapshot.
   */
  const updateLocal = useCallback((fn: (d: LocalData) => LocalData) => {
    setData((prev) => {
      const next = fn({ program: prev.program, sessions: prev.sessions, measurements: prev.measurements, spreadsheetId: prev.spreadsheetId });
      saveLocalData(next);
      return { ...prev, ...next };
    });
  }, []);

  const actions: AppDataActions = {
    saveProgram(p) {
      const program = { ...p, updatedAt: new Date().toISOString() };
      if (uid) {
        void setDoc(doc(db, 'users', uid), { program, updatedAt: program.updatedAt }, { merge: true }).catch(fail('Salvataggio della scheda non riuscito'));
        setData((d) => ({ ...d, program }));
      } else updateLocal((d) => ({ ...d, program }));
    },
    addSession(s) {
      if (uid) void setDoc(doc(db, 'users', uid, 'sessions', s.id), { ...s, userId: uid }).catch(fail('Salvataggio dell\'allenamento non riuscito'));
      else updateLocal((d) => ({ ...d, sessions: [s, ...d.sessions].sort(sortSessions) }));
    },
    updateSession(id, patch) {
      if (uid) void setDoc(doc(db, 'users', uid, 'sessions', id), { ...patch, userId: uid }, { merge: true }).catch(fail('Aggiornamento non riuscito'));
      else updateLocal((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
    },
    deleteSession(id) {
      if (uid) void deleteDoc(doc(db, 'users', uid, 'sessions', id)).catch(fail('Eliminazione non riuscita'));
      else updateLocal((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
    },
    addMeasurement(m) {
      if (uid) void setDoc(doc(db, 'users', uid, 'measurements', m.id), { ...m, userId: uid }).catch(fail('Salvataggio della misura non riuscito'));
      else updateLocal((d) => ({ ...d, measurements: [...d.measurements, m].sort(sortMeasurements) }));
    },
    updateMeasurement(id, patch) {
      if (uid) void setDoc(doc(db, 'users', uid, 'measurements', id), { ...patch, userId: uid }, { merge: true }).catch(fail('Aggiornamento non riuscito'));
      else updateLocal((d) => ({ ...d, measurements: d.measurements.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    },
    deleteMeasurement(id) {
      if (uid) void deleteDoc(doc(db, 'users', uid, 'measurements', id)).catch(fail('Eliminazione non riuscita'));
      else updateLocal((d) => ({ ...d, measurements: d.measurements.filter((m) => m.id !== id) }));
    },
    setSpreadsheetId(id) {
      if (uid) void setDoc(doc(db, 'users', uid), { spreadsheetId: id }, { merge: true }).catch(fail('Salvataggio del foglio non riuscito'));
      else updateLocal((d) => ({ ...d, spreadsheetId: id }));
    },
    async importAll(incoming) {
      const program = normalizeProgram(incoming.program);
      const sessions = (incoming.sessions ?? []).map((s) => normalizeSession(s as never));
      const measurements = (incoming.measurements ?? []).map((m) => normalizeMeasurement(m as never));
      if (uid) {
        // i batch di Firestore accettano al massimo 500 scritture
        const writes: [string[], object][] = [
          [['users', uid], { program, spreadsheetId: incoming.spreadsheetId ?? '', updatedAt: new Date().toISOString() }],
          ...sessions.map((s): [string[], object] => [['users', uid, 'sessions', s.id], { ...s, userId: uid }]),
          ...measurements.map((m): [string[], object] => [['users', uid, 'measurements', m.id], { ...m, userId: uid }])
        ];
        for (let i = 0; i < writes.length; i += 450) {
          const batch = writeBatch(db);
          writes.slice(i, i + 450).forEach(([path, value]) => {
            const [first, ...rest] = path;
            batch.set(doc(db, first, ...rest), value, { merge: true });
          });
          await batch.commit();
        }
      } else {
        updateLocal(() => ({ program, sessions: sessions.sort(sortSessions), measurements: measurements.sort(sortMeasurements), spreadsheetId: incoming.spreadsheetId ?? '' }));
      }
    }
  };

  return [data, actions];
}
