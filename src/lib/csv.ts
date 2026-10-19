import type { WorkoutProgram } from '../types';
import { SECTION_LABELS } from '../data/defaultProgram';

export function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Righe della scheda nello stesso formato del foglio del trainer. */
export function programRows(program: WorkoutProgram): string[][] {
  const weeks = Array.from({ length: program.totalWeeks }, (_, i) => i + 1);
  const rows: string[][] = [
    [program.title],
    [`${program.athlete} con ${program.trainer}`],
    []
  ];

  for (const day of program.days) {
    rows.push([day.subtitle ? `${day.title}: ${day.subtitle}` : day.title, 'Note', 'Riscaldamento', 'Recupero', ...weeks.map((w) => `Sett. ${w}`)]);
    let section = '';
    for (const ex of day.exercises) {
      if (ex.sectionType !== section) {
        section = ex.sectionType;
        rows.push([SECTION_LABELS[ex.sectionType]]);
      }
      rows.push([
        ex.name,
        ex.note ?? '',
        ex.warmupNote ?? '',
        `${Math.round(ex.restTimeSec)}s`,
        ...weeks.map((w) => ex.weeks[w] ?? '')
      ]);
    }
    rows.push([]);
  }

  rows.push(["Modalità d'esecuzione"]);
  program.guidelines.modalitaEsecuzione.forEach((m) => rows.push([m]));
  rows.push([]);
  rows.push(['Progressione'], [program.guidelines.progressione], []);
  rows.push(['Cedimento'], [program.guidelines.cedimento]);
  return rows;
}

export function programCSV(program: WorkoutProgram): string {
  return toCSV(programRows(program));
}
