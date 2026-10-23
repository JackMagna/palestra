import type { SetEntry, WorkoutProgram, WorkoutSession } from '../types';

/** 0 -> A, 25 -> Z, 26 -> AA */
export function colLetter(index: number): string {
  let n = index;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

const kg = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** "40 kg" se uguale su tutte le serie, altrimenti "40/40/42,5 kg" */
export function loadsText(sets: Pick<SetEntry, 'weightKg' | 'setIndex'>[]): string {
  const w = [...sets].sort((a, b) => a.setIndex - b.setIndex).map((s) => s.weightKg);
  if (w.length === 0) return '';
  return w.every((x) => x === w[0]) ? `${kg(w[0])} kg` : `${w.map(kg).join('/')} kg`;
}

export const annotatedCell = (prescription: string, loads: string) => `${prescription} · ${loads}`;

/** Esercizi senza peso (addome): si scrivono le ripetizioni fatte, es. "15/14/12 rip" */
export function repsText(sets: Pick<SetEntry, 'reps' | 'setIndex'>[]): string {
  return `${[...sets].sort((a, b) => a.setIndex - b.setIndex).map((s) => s.reps).join('/')} rip`;
}

const LOADS_RE = /^\d+([.,]\d+)?(\/\d+([.,]\d+)?)*\s*(kg|rip)$/i;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Si scrive solo se la cella è vuota o contiene ancora la prescrizione del coach (o una nostra nota precedente). */
export function canOverwrite(current: string, prescription: string, mode?: 'loads'): boolean {
  const c = norm(current);
  if (c === '') return true;
  // celle dei carichi: si aggiorna solo ciò che ha scritto l'app ("40 kg", "40/42,5 kg")
  if (mode === 'loads') return LOADS_RE.test(c);
  // celle con la prescrizione (addome): si può aggiungere dopo "4xMAX", ma non toccare altro
  const p = norm(prescription);
  if (p === '' || !c.startsWith(p)) return false;
  const rest = c.slice(p.length).replace(/^\s*·\s*/, '');
  return rest === '' || LOADS_RE.test(rest);
}

export interface CellPlan {
  a1: string;
  exerciseName: string;
  prescription: string;
  value: string;
  mode?: 'loads';
}

const key = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');

/** Celle da compilare nella griglia del coach per una sessione. */
export function planAnnotations(program: WorkoutProgram, session: WorkoutSession): CellPlan[] {
  const src = program.source;
  const col = src?.weekCols[session.weekNumber];
  if (!src || col === undefined) return [];
  const exercises = program.days.flatMap((d) => d.exercises);
  const plans: CellPlan[] = [];
  const byExercise = new Map<string, SetEntry[]>();
  for (const s of session.sets) {
    const ex = exercises.find((e) => (s.exerciseId && e.id === s.exerciseId) || key(e.name) === key(s.exerciseName));
    if (ex) byExercise.set(ex.id, [...(byExercise.get(ex.id) ?? []), s]);
  }
  for (const [id, sets] of byExercise) {
    const ex = exercises.find((e) => e.id === id)!;
    const prescription = ex.weeks[session.weekNumber] ?? '';
    if (!ex.sheetRow || !prescription) continue;
    const text = sets.every((s) => s.weightKg === 0) ? repsText(sets) : loadsText(sets);
    plans.push({
      a1: `${colLetter(col)}${ex.sheetRow}`,
      exerciseName: ex.name,
      prescription,
      mode: ex.cellMode,
      value: ex.cellMode === 'loads' ? text : annotatedCell(prescription, text)
    });
  }
  return plans;
}
