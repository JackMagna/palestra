import type { Measurement, WorkoutProgram, WorkoutSession } from '../types';
import { readJSON, removeKey, writeJSON } from '../lib/storage';
import { normalizeMeasurement, normalizeProgram, normalizeSession } from './normalize';

/** Dati salvati sul dispositivo quando usi l'app senza account. */
export interface LocalData {
  program: WorkoutProgram;
  sessions: WorkoutSession[];
  measurements: Measurement[];
  spreadsheetId: string;
}

const KEY = 'irontrack:local-data';
const LEGACY = {
  sessions: 'irontrack_sessions',
  measurements: 'irontrack_measurements',
  sheet: 'irontrack_sheet_id',
  initialized: 'irontrack_initialized'
};

export function loadLocalData(): LocalData {
  const stored = readJSON<Partial<LocalData> | null>(KEY, null);
  if (stored) {
    return {
      program: normalizeProgram(stored.program),
      sessions: (stored.sessions ?? []).map((s) => normalizeSession(s as never)),
      measurements: (stored.measurements ?? []).map((m) => normalizeMeasurement(m as never)),
      spreadsheetId: stored.spreadsheetId ?? ''
    };
  }
  // Prima apertura dopo l'aggiornamento: recupera i dati della versione precedente.
  const data: LocalData = {
    program: normalizeProgram(null),
    sessions: readJSON<Record<string, unknown>[]>(LEGACY.sessions, []).map((s) => normalizeSession(s)),
    measurements: readJSON<Record<string, unknown>[]>(LEGACY.measurements, []).map((m) => normalizeMeasurement(m)),
    spreadsheetId: rawLegacySheet()
  };
  saveLocalData(data);
  Object.values(LEGACY).forEach(removeKey);
  return data;
}

function rawLegacySheet(): string {
  try {
    const v = localStorage.getItem(LEGACY.sheet) ?? '';
    return v.replace(/^"|"$/g, '');
  } catch {
    return '';
  }
}

export function saveLocalData(data: LocalData) {
  writeJSON(KEY, data);
}

export function hasLocalActivity(data: LocalData): boolean {
  return data.sessions.length > 0 || data.measurements.length > 0 || !!data.program.updatedAt;
}

export function clearLocalData() {
  removeKey(KEY);
}
