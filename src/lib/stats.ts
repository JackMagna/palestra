import type { SetEntry, WorkoutSession } from '../types';

export function volumeOf(sets: Pick<SetEntry, 'weightKg' | 'reps'>[]): number {
  return Math.round(sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0) * 10) / 10;
}

/** Massimale stimato (formula di Epley). Con 1 ripetizione restituisce il peso. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

function matches(set: SetEntry, exerciseId: string, exerciseName?: string): boolean {
  if (set.exerciseId && set.exerciseId === exerciseId) return true;
  return !!exerciseName && set.exerciseName.trim().toLowerCase() === exerciseName.trim().toLowerCase();
}

function byTimeDesc(a: WorkoutSession, b: WorkoutSession) {
  return (b.startedAt || 0) - (a.startedAt || 0) || b.date.localeCompare(a.date);
}

/** Pesi usati nell'ultima sessione in cui compare l'esercizio, ordinati per serie. */
export function lastSetsFor(sessions: WorkoutSession[], exerciseId: string, exerciseName?: string): SetEntry[] {
  const sorted = [...sessions].sort(byTimeDesc);
  for (const s of sorted) {
    const found = s.sets.filter((set) => matches(set, exerciseId, exerciseName));
    if (found.length) return found.sort((a, b) => a.setIndex - b.setIndex);
  }
  return [];
}

export interface PersonalBest {
  weightKg: number;
  reps: number;
  oneRepMax: number;
  date: string;
}

export function personalBest(sessions: WorkoutSession[], exerciseId: string, exerciseName?: string): PersonalBest | null {
  let best: PersonalBest | null = null;
  for (const s of sessions) {
    for (const set of s.sets) {
      if (!matches(set, exerciseId, exerciseName)) continue;
      const orm = estimateOneRepMax(set.weightKg, set.reps);
      if (!best || orm > best.oneRepMax) {
        best = { weightKg: set.weightKg, reps: set.reps, oneRepMax: orm, date: s.date };
      }
    }
  }
  return best;
}

/** Andamento di un esercizio: miglior massimale stimato per ogni sessione. */
export function exerciseTrend(sessions: WorkoutSession[], exerciseId: string, exerciseName?: string) {
  return [...sessions]
    .sort((a, b) => -byTimeDesc(a, b))
    .map((s) => {
      const sets = s.sets.filter((set) => matches(set, exerciseId, exerciseName));
      if (!sets.length) return null;
      const top = Math.max(...sets.map((x) => estimateOneRepMax(x.weightKg, x.reps)));
      return { date: s.date, value: top };
    })
    .filter((x): x is { date: string; value: number } => x !== null);
}

export function isPersonalRecord(
  sessions: WorkoutSession[],
  exerciseId: string,
  exerciseName: string,
  weightKg: number,
  reps: number
): boolean {
  const best = personalBest(sessions, exerciseId, exerciseName);
  if (!best) return false; // la prima volta non è un record, è un punto di partenza
  return estimateOneRepMax(weightKg, reps) > best.oneRepMax;
}

/** Sessioni negli ultimi 7 giorni rispetto a `now`. */
export function sessionsThisWeek(sessions: WorkoutSession[], now = Date.now()): number {
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => (s.startedAt || Date.parse(s.date)) >= weekAgo).length;
}
