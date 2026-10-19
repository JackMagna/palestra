export interface Prescription {
  sets: number;
  /** ripetizioni target per ogni serie */
  reps: number[];
  isMax: boolean;
  increaseWeight: boolean;
}

const FALLBACK: Prescription = { sets: 3, reps: [10, 10, 10], isMax: false, increaseWeight: false };
/** Ripetizioni proposte quando la scheda dice "MAX" */
export const MAX_REPS_DEFAULT = 12;

/**
 * Interpreta la prescrizione scritta nella scheda.
 * Esempi: "3X10", "4x8 AUMENTO PESO", "10-9-8..", "4xMAX", "12-10-8-6".
 */
export function parsePrescription(raw: string | undefined | null): Prescription {
  if (!raw) return { ...FALLBACK, reps: [...FALLBACK.reps] };
  const text = raw.trim().toUpperCase();
  const increaseWeight = /AUMENTO|\+\s*PESO|\bUP\b/.test(text);

  const max = text.match(/(\d+)\s*[X×]\s*MAX/);
  if (max) {
    const sets = clampSets(Number(max[1]));
    return { sets, reps: Array(sets).fill(MAX_REPS_DEFAULT), isMax: true, increaseWeight };
  }

  const fixed = text.match(/(\d+)\s*[X×]\s*(\d+)/);
  if (fixed) {
    const sets = clampSets(Number(fixed[1]));
    const reps = Math.max(1, Number(fixed[2]));
    return { sets, reps: Array(sets).fill(reps), isMax: false, increaseWeight };
  }

  const pyramid = text.match(/^\d+(\s*-\s*\d+)+/);
  if (pyramid) {
    const reps = pyramid[0].split('-').map((n) => Math.max(1, Number(n.trim())));
    const sets = clampSets(reps.length);
    return { sets, reps: reps.slice(0, sets), isMax: false, increaseWeight };
  }

  return { ...FALLBACK, reps: [...FALLBACK.reps], increaseWeight };
}

function clampSets(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(10, Math.round(n));
}

/** Testo leggibile, es. "3 serie × 10" oppure "3 serie: 10, 9, 8" */
export function describePrescription(raw: string | undefined): string {
  const p = parsePrescription(raw);
  if (p.isMax) return `${p.sets} serie al massimo`;
  const same = p.reps.every((r) => r === p.reps[0]);
  const base = same ? `${p.sets} × ${p.reps[0]}` : `${p.sets} serie: ${p.reps.join(', ')}`;
  return p.increaseWeight ? `${base}, aumenta il carico` : base;
}
