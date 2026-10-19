import type { ProgramDay, SetLog, WorkoutProgram, WorkoutSession } from '../../types';
import { parsePrescription } from '../../lib/prescription';
import { lastSetsFor } from '../../lib/stats';
import { readJSON, removeKey, writeJSON } from '../../lib/storage';

export interface WorkoutDraft {
  dayId: string;
  week: number;
  /** momento della prima serie completata */
  startedAt: number | null;
  sets: Record<string, SetLog[]>;
  exIndex: number;
  setIndex: number;
  hr: { sum: number; count: number; max: number };
}

const KEY = 'irontrack:workout-draft';

export function loadDraft(): WorkoutDraft | null {
  return readJSON<WorkoutDraft | null>(KEY, null);
}
export function saveDraft(d: WorkoutDraft) {
  writeJSON(KEY, d);
}
export function clearDraft() {
  removeKey(KEY);
}

export function draftHasProgress(d: WorkoutDraft | null): boolean {
  return !!d && Object.values(d.sets).some((list) => list.some((s) => s.completed));
}

/** Serie iniziali: prescrizione della settimana + pesi usati l'ultima volta. */
export function buildDraft(day: ProgramDay, week: number, sessions: WorkoutSession[]): WorkoutDraft {
  const sets: Record<string, SetLog[]> = {};
  for (const ex of day.exercises) {
    const p = parsePrescription(ex.weeks[week]);
    const last = lastSetsFor(sessions, ex.id, ex.name);
    const fallbackWeight = ex.sectionType === 'core' ? 0 : 20;
    sets[ex.id] = p.reps.map((reps, i) => ({
      weightKg: last[i]?.weightKg ?? last[last.length - 1]?.weightKg ?? fallbackWeight,
      reps,
      completed: false
    }));
  }
  return { dayId: day.id, week, startedAt: null, sets, exIndex: 0, setIndex: 0, hr: { sum: 0, count: 0, max: 0 } };
}

/** Allenamento suggerito: il giorno dopo l'ultimo fatto, nella stessa settimana del programma. */
export function suggestNext(program: WorkoutProgram, sessions: WorkoutSession[]): { dayId: string; week: number } {
  const last = [...sessions].sort((a, b) => b.startedAt - a.startedAt)[0];
  if (!last) return { dayId: program.days[0]?.id ?? '', week: 1 };
  const idx = program.days.findIndex((d) => d.id === last.dayId);
  if (idx === -1) return { dayId: program.days[0]?.id ?? '', week: Math.min(last.weekNumber, program.totalWeeks) };
  const nextIdx = (idx + 1) % program.days.length;
  const week = nextIdx === 0 ? Math.min(program.totalWeeks, last.weekNumber + 1) : last.weekNumber;
  return { dayId: program.days[nextIdx].id, week: Math.max(1, week) };
}
