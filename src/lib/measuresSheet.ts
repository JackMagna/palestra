import type { Measurement, WorkoutProgram, WorkoutSession } from '../types';
import { weekOf } from './coachSheet';
import { colLetter } from './sheetWrite';

export type MeasureField = 'weightKg' | 'waistCm' | 'abdomenCm' | 'hipsCm' | 'armsCm' | 'thighsCm' | 'chestCm' | 'bodyFat';

export const FIELD_LABEL: Record<MeasureField, string> = {
  weightKg: 'Peso', waistCm: 'Vita', abdomenCm: 'Addome', hipsCm: 'Fianchi', armsCm: 'Braccio', thighsCm: 'Coscia', chestCm: 'Petto', bodyFat: 'Grasso'
};
export const FIELD_UNIT: Record<MeasureField, string> = {
  weightKg: 'kg', waistCm: 'cm', abdomenCm: 'cm', hipsCm: 'cm', armsCm: 'cm', thighsCm: 'cm', chestCm: 'cm', bodyFat: '%'
};
export const ALL_FIELDS = Object.keys(FIELD_LABEL) as MeasureField[];

/** Riconosce le righe del foglio dal nome (PESO, VITA, ADDOME, FIANCHI, BRACCIO CONTRAIONE, COSCIA…). */
const ROW_PATTERNS: [MeasureField, RegExp][] = [
  ['weightKg', /^PESO/], ['waistCm', /^VITA/], ['abdomenCm', /^ADDOM/], ['hipsCm', /^FIANC/],
  ['armsCm', /^BRACCI/], ['thighsCm', /^COSC/], ['chestCm', /^(PETTO|TORACE)/], ['bodyFat', /^(GRASS|MASSA GRASSA|BF\b|BODY FAT)/]
];

const normLabel = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

export function parseNumber(v: unknown): number | undefined {
  const t = String(v ?? '').replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return undefined;
  const n = Number(t);
  return n > 0 ? n : undefined;
}

export interface MeasuresLayout {
  /** colonna (da 0) di ogni settimana */
  weekCols: Record<number, number>;
  /** riga (da 0) di ogni misura */
  fieldRows: Partial<Record<MeasureField, number>>;
}
export type SheetValues = Record<number, Partial<Record<MeasureField, number>>>;

/** Legge la scheda MISURE: colonne = settimane, righe = misure. */
export function parseMeasuresTab(rows: string[][]): { layout: MeasuresLayout; values: SheetValues } {
  let header = -1;
  let weekCols: Record<number, number> = {};
  for (let i = 0; i < rows.length; i++) {
    const cols: Record<number, number> = {};
    (rows[i] ?? []).forEach((c, j) => {
      const w = weekOf(String(c ?? ''));
      if (w !== null && j > 0) cols[w] = j;
    });
    if (Object.keys(cols).length >= 2 || (Object.keys(cols).length === 1 && /SETTIMAN/.test(normLabel(rows[i]?.[0])))) {
      header = i;
      weekCols = cols;
      break;
    }
  }
  if (header < 0) throw new Error('Nella scheda delle misure non trovo le colonne delle settimane ("1 SETT.", "2 SETT."…).');

  const fieldRows: MeasuresLayout['fieldRows'] = {};
  for (let i = header + 1; i < rows.length; i++) {
    const label = normLabel(rows[i]?.[0]);
    if (!label) continue;
    const hit = ROW_PATTERNS.find(([f, re]) => !(f in fieldRows) && re.test(label));
    if (hit) fieldRows[hit[0]] = i;
  }
  if (Object.keys(fieldRows).length === 0) throw new Error('Nella scheda delle misure non trovo righe come PESO, VITA, COSCIA…');

  const values: SheetValues = {};
  for (const [w, col] of Object.entries(weekCols)) {
    for (const [field, row] of Object.entries(fieldRows) as [MeasureField, number][]) {
      const n = parseNumber(rows[row]?.[col]);
      if (n !== undefined) (values[Number(w)] ??= {})[field] = n;
    }
  }
  return { layout: { weekCols, fieldRows }, values };
}

export const cellA1 = (layout: MeasuresLayout, week: number, field: MeasureField): string | null => {
  const col = layout.weekCols[week];
  const row = layout.fieldRows[field];
  return col === undefined || row === undefined ? null : `${colLetter(col)}${row + 1}`;
};

/* ---------- settimane e date ---------- */
const DAY = 86_400_000;
const toMs = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Primo giorno della settimana 1: quello impostato, altrimenti dedotto dagli allenamenti, altrimenti oggi. */
export function inferStartDate(program: WorkoutProgram, sessions: WorkoutSession[], today = toIso(Date.now())): string {
  if (program.startDate) return program.startDate;
  const starts = sessions.filter((s) => s.date && s.weekNumber >= 1).map((s) => toMs(s.date) - (s.weekNumber - 1) * 7 * DAY);
  return starts.length ? toIso(Math.min(...starts)) : today;
}
export const weekDate = (start: string, week: number) => toIso(toMs(start) + (week - 1) * 7 * DAY);
export function weekOfDate(start: string, date: string, totalWeeks: number): number {
  const w = Math.floor((toMs(date) - toMs(start)) / (7 * DAY)) + 1;
  return Math.min(Math.max(1, w), Math.max(1, totalWeeks));
}

/* ---------- confronto foglio / app ---------- */
export interface MeasureConflict {
  week: number;
  field: MeasureField;
  sheetValue: number;
  appValue: number;
  measurementId: string;
}
export interface Reconciliation {
  /** settimane che il foglio ha e l'app no */
  add: Measurement[];
  /** misure dell'app a cui manca un campo che il foglio ha */
  fill: { id: string; patch: Partial<Measurement> }[];
  /** valori dell'app che nel foglio sono vuoti */
  write: { week: number; field: MeasureField; value: number }[];
  /** valori diversi nei due posti: decide l'utente */
  conflicts: MeasureConflict[];
}

export function reconcileMeasures(a: {
  layout: MeasuresLayout;
  sheetValues: SheetValues;
  measurements: Measurement[];
  startDate: string;
  totalWeeks: number;
}): Reconciliation {
  const out: Reconciliation = { add: [], fill: [], write: [], conflicts: [] };
  const weeks = Object.keys(a.layout.weekCols).map(Number).sort((x, y) => x - y);
  const fields = Object.keys(a.layout.fieldRows) as MeasureField[];
  const maxWeek = Math.max(...weeks);

  for (const week of weeks) {
    const mine = a.measurements
      .filter((m) => (m.week ?? weekOfDate(a.startDate, m.date, maxWeek)) === week)
      .sort((x, y) => x.date.localeCompare(y.date) || x.id.localeCompare(y.id));
    const sheet = a.sheetValues[week] ?? {};

    if (mine.length === 0) {
      if (Object.keys(sheet).length) {
        out.add.push({ id: `foglio-w${week}`, week, date: weekDate(a.startDate, week), source: 'Foglio', sheetsSynced: true, ...sheet });
      }
      continue;
    }
    for (const f of fields) {
      const holder = [...mine].reverse().find((m) => m[f] !== undefined);
      const appV = holder?.[f] as number | undefined;
      const sheetV = sheet[f];
      if (appV !== undefined && sheetV === undefined) out.write.push({ week, field: f, value: appV });
      else if (appV === undefined && sheetV !== undefined) out.fill.push({ id: mine[mine.length - 1].id, patch: { [f]: sheetV } });
      else if (appV !== undefined && sheetV !== undefined && Math.abs(appV - sheetV) > 1e-6) {
        out.conflicts.push({ week, field: f, sheetValue: sheetV, appValue: appV, measurementId: holder!.id });
      }
    }
  }
  // più "fill" sulla stessa misura vanno uniti
  const merged = new Map<string, Partial<Measurement>>();
  out.fill.forEach((x) => merged.set(x.id, { ...(merged.get(x.id) ?? {}), ...x.patch }));
  out.fill = [...merged].map(([id, patch]) => ({ id, patch }));
  return out;
}
