import type { Measurement, ProgramExercise, WorkoutProgram, WorkoutSession } from '../types';
import { DEFAULT_PROGRAM } from '../data/defaultProgram';
import { volumeOf } from '../lib/stats';

type Loose = Record<string, unknown>;
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

/**
 * Converte una sessione salvata (anche dalla versione precedente dell'app,
 * che usava `completedSets` e `sessionId`) nel formato attuale.
 */
export function normalizeSession(raw: Loose, fallbackId?: string): WorkoutSession {
  const rawSets = (Array.isArray(raw.sets) ? raw.sets : Array.isArray(raw.completedSets) ? raw.completedSets : []) as Loose[];
  const sets = rawSets.map((s) => ({
    exerciseId: str(s.exerciseId),
    exerciseName: str(s.exerciseName, 'Esercizio'),
    setIndex: num(s.setIndex),
    weightKg: num(s.weightKg),
    reps: num(s.reps)
  }));
  const date = str(raw.date) || str(raw.createdAt).slice(0, 10) || new Date().toISOString().slice(0, 10);
  const durationMinutes = num(raw.durationMinutes, 0);
  const endedAt = num(raw.endedAt) || Date.parse(str(raw.createdAt)) || Date.parse(`${date}T12:00:00`);
  const startedAt = num(raw.startedAt) || endedAt - durationMinutes * 60000;
  return {
    id: str(raw.id) || str(raw.sessionId) || fallbackId || `s-${startedAt}`,
    date,
    startedAt,
    endedAt,
    dayId: str(raw.dayId),
    dayTitle: str(raw.dayTitle, 'Allenamento'),
    weekNumber: num(raw.weekNumber, 1),
    durationMinutes,
    totalVolumeKg: num(raw.totalVolumeKg) || volumeOf(sets),
    sets,
    avgBpm: raw.avgBpm === undefined ? undefined : num(raw.avgBpm),
    maxBpm: raw.maxBpm === undefined ? undefined : num(raw.maxBpm),
    sheetsSynced: raw.sheetsSynced === undefined ? undefined : !!raw.sheetsSynced,
    fitbitSynced: raw.fitbitSynced === undefined ? undefined : !!raw.fitbitSynced,
    fitbitLogId: raw.fitbitLogId === undefined ? undefined : num(raw.fitbitLogId)
  };
}

export function normalizeMeasurement(raw: Loose, fallbackId?: string): Measurement {
  const opt = (v: unknown) => (v === undefined || v === null || v === '' ? undefined : num(v));
  return {
    id: str(raw.id) || fallbackId || `m-${Date.now()}`,
    date: str(raw.date) || new Date().toISOString().slice(0, 10),
    weightKg: num(raw.weightKg),
    bodyFat: opt(raw.bodyFat),
    chestCm: opt(raw.chestCm),
    waistCm: opt(raw.waistCm),
    armsCm: opt(raw.armsCm),
    thighsCm: opt(raw.thighsCm),
    notes: str(raw.notes) || undefined,
    sheetsSynced: raw.sheetsSynced === undefined ? undefined : !!raw.sheetsSynced,
    source: str(raw.source) || undefined
  };
}

/** Valida una scheda letta da storage/cloud; se non è valida usa quella di partenza. */
export function normalizeProgram(raw: unknown): WorkoutProgram {
  const p = raw as Partial<WorkoutProgram> | null;
  if (!p || !Array.isArray(p.days) || p.days.length === 0) return structuredClone(DEFAULT_PROGRAM);
  const totalWeeks = Math.min(16, Math.max(1, num(p.totalWeeks, 6)));
  return {
    title: str(p.title, DEFAULT_PROGRAM.title),
    athlete: str(p.athlete),
    trainer: str(p.trainer),
    totalWeeks,
    updatedAt: p.updatedAt,
    source: p.source?.tab
      ? {
          tab: String(p.source.tab),
          annotate: !!p.source.annotate,
          weekCols: Object.fromEntries(Object.entries(p.source.weekCols ?? {}).map(([k, v]) => [Number(k), Number(v)]))
        }
      : undefined,
    guidelines: {
      modalitaEsecuzione: Array.isArray(p.guidelines?.modalitaEsecuzione) ? p.guidelines!.modalitaEsecuzione.map(String) : [],
      progressione: str(p.guidelines?.progressione),
      cedimento: str(p.guidelines?.cedimento)
    },
    days: p.days.map((d, di) => ({
      id: str(d.id, `giorno-${di + 1}`),
      title: str(d.title, `Giorno ${di + 1}`),
      subtitle: str(d.subtitle) || undefined,
      exercises: (Array.isArray(d.exercises) ? d.exercises : []).map((e: Partial<ProgramExercise>, ei) => ({
        id: str(e.id, `ex-${di + 1}-${ei + 1}`),
        name: str(e.name, 'Esercizio'),
        libraryId: str(e.libraryId) || undefined,
        note: str(e.note) || undefined,
        warmupNote: str(e.warmupNote) || undefined,
        sectionType: e.sectionType === 'cedimento' || e.sectionType === 'core' ? e.sectionType : 'progressione',
        restTimeSec: Math.max(0, num(e.restTimeSec, 120)),
        sheetRow: e.sheetRow ? num(e.sheetRow) : undefined,
        weeks: Object.fromEntries(Object.entries(e.weeks ?? {}).map(([k, v]) => [Number(k), String(v)]))
      }))
    }))
  };
}
