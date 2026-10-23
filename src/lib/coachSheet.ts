import type { ProgramDay, ProgramExercise, SectionType, WorkoutProgram } from '../types';

export interface ParsedSheet {
  program: WorkoutProgram;
  warnings: string[];
  exerciseCount: number;
}

const DAY_RE = /^(giorno|day|allenamento|workout)\s*([0-9]+|[a-d])\b/i;
const GUIDE_RE = /^modalit/i;

const clean = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();
const capFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "CHEST PRESS" -> "Chest press": solo se il testo è tutto maiuscolo */
export function sentenceCase(s: string): string {
  const t = clean(s);
  if (!t || t !== t.toUpperCase() || t === t.toLowerCase()) return t;
  const lower = t.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function weekOf(cell: string): number | null {
  const a = cell.match(/(\d+)\s*[°ª^]?\s*(?:sett|settimana|week|wk)\b/i);
  if (a) return Number(a[1]);
  const b = cell.match(/^(?:sett|settimana|week|wk)\.?\s*(\d+)\s*$/i);
  return b ? Number(b[1]) : null;
}

function sectionTypeOf(label: string): SectionType {
  if (/cedim/i.test(label)) return 'cedimento';
  if (/core|addom/i.test(label)) return 'core';
  return 'progressione';
}

function restFrom(label: string): number | null {
  const min = label.match(/rip(?:oso)?\.?\s*(\d+(?:[.,]\d+)?)\s*(?:'|’|′|min|m\b)/i);
  if (min) return Math.round(Number(min[1].replace(',', '.')) * 60);
  const sec = label.match(/rip(?:oso)?\.?\s*(\d+)\s*(?:"|''|″|sec|s\b)/i);
  return sec ? Number(sec[1]) : null;
}

const isSectionLabel = (c0: string) => /^(progressione|cedimento|core|addominali)\b/i.test(c0) && /(serie|rip|rec)/i.test(c0);
const isBareLabel = (c0: string) => /^(progressione|cedimento)\s*:?$/i.test(c0);

/**
 * Trasforma le celle del foglio del coach in una scheda.
 * Riconosce righe "GIORNO n" con colonne "n SETT.", intestazioni di sezione
 * ("PROGRESSIONE SERIE X REP RIP. 2'"), gli esercizi e le indicazioni finali.
 */
export function parseCoachSheet(rows: string[][], tab = ''): ParsedSheet {
  const warnings: string[] = [];
  const cell = (r: string[] | undefined, i: number) => clean(r?.[i]);
  const filled = (r: string[] | undefined) => (r ?? []).some((c) => clean(c) !== '');

  const dayStarts: number[] = [];
  rows.forEach((r, i) => {
    if (DAY_RE.test(cell(r, 0))) dayStarts.push(i);
  });
  if (dayStarts.length === 0) {
    throw new Error('Non trovo nessuna riga "GIORNO 1", "GIORNO 2"… in questo foglio. Controlla di aver scelto la scheda giusta.');
  }

  // Titolo, atleta e trainer dalle righe prima del primo giorno
  const head = rows.slice(0, dayStarts[0]).flatMap((r) => (r ?? []).map(clean).filter(Boolean));
  const title = head[0] ? sentenceCase(head[0]) : 'Programma palestra';
  let athlete = '';
  let trainer = '';
  if (head[1]) {
    const parts = head[1].split(/\s*[•·|–—]\s*|\s+-\s+|\s+con\s+/i).map(clean).filter(Boolean);
    athlete = sentenceCase(parts[0] ?? '');
    trainer = sentenceCase(parts.slice(1).join(' '));
  }

  const days: ProgramDay[] = [];
  const weekCols: Record<number, number> = {};
  let guidelinesStart = rows.length;

  dayStarts.forEach((start, di) => {
    const header = rows[start] ?? [];
    const cols: Record<number, number> = {};
    let noteCol = -1;
    header.forEach((c, j) => {
      const w = weekOf(clean(c));
      if (w !== null && j > 0) cols[w] = j;
      else if (/^note/i.test(clean(c))) noteCol = j;
    });
    if (Object.keys(cols).length === 0) {
      warnings.push(`${clean(header[0])}: non trovo le colonne delle settimane ("1 SETT.", "2 SETT."…), lo salto.`);
      return;
    }
    Object.assign(weekCols, cols);

    const next = di + 1 < dayStarts.length ? dayStarts[di + 1] : rows.length;
    const exercises: ProgramExercise[] = [];
    let section: { type: SectionType; rest: number | null; warm: string } | null = null;

    for (let i = start + 1; i < next; i++) {
      const r = rows[i];
      const c0 = cell(r, 0);
      if (!filled(r) || !c0) continue;
      if (GUIDE_RE.test(c0)) {
        guidelinesStart = Math.min(guidelinesStart, i);
        break;
      }
      const hasWeeks = Object.values(cols).some((j) => cell(r, j) !== '');
      if (isSectionLabel(c0) || (isBareLabel(c0) && !hasWeeks && nextHasWeeks(rows, i, next, cols))) {
        section = { type: sectionTypeOf(c0), rest: restFrom(c0), warm: noteCol >= 0 ? cell(r, noteCol) : '' };
        continue;
      }
      if (isBareLabel(c0)) {
        guidelinesStart = Math.min(guidelinesStart, i);
        break;
      }
      if (!hasWeeks && cell(r, 1) === '' && !section) continue; // riga di testo isolata

      const weeks: Record<number, string> = {};
      Object.entries(cols).forEach(([w, j]) => (weeks[Number(w)] = cell(r, j)));
      const values = Object.values(weeks).filter(Boolean);
      const inferred: SectionType = values.length && values.every((v) => /max/i.test(v)) ? 'core' : values.length && values.every((v) => /^\d+\s*-\s*\d+/.test(v)) ? 'cedimento' : 'progressione';
      const type = section?.type ?? inferred;
      const note = noteCol >= 0 ? cell(r, noteCol) : '';
      exercises.push({
        id: `ex-${di + 1}-${exercises.length + 1}`,
        name: sentenceCase(c0),
        note: note ? capFirst(sentenceCase(note)) : undefined,
        warmupNote: section?.warm ? capFirst(sentenceCase(section.warm)) : undefined,
        sectionType: type,
        restTimeSec: section?.rest ?? (type === 'core' ? 90 : 120),
        weeks,
        sheetRow: i + 1
      });
    }

    if (!exercises.length) warnings.push(`${clean(header[0])}: nessun esercizio trovato.`);
    const num = clean(header[0]).match(DAY_RE)?.[2] ?? String(di + 1);
    days.push({ id: `giorno-${num.toLowerCase()}`, title: sentenceCase(clean(header[0])), exercises });
  });

  // Indicazioni finali
  const guide: string[] = [];
  let progressione = '';
  let cedimento = '';
  let mode: 'mod' | 'prog' | 'ced' = 'mod';
  for (let i = guidelinesStart; i < rows.length; i++) {
    const c0 = cell(rows[i], 0);
    if (!c0) continue;
    if (GUIDE_RE.test(c0)) { mode = 'mod'; continue; }
    if (isBareLabel(c0)) { mode = /^cedim/i.test(c0) ? 'ced' : 'prog'; continue; }
    const line = capFirst(sentenceCase(c0));
    if (mode === 'mod') guide.push(line);
    else if (mode === 'prog') progressione = progressione ? `${progressione} ${line}` : line;
    else cedimento = cedimento ? `${cedimento} ${line}` : line;
  }

  const exerciseCount = days.reduce((n, d) => n + d.exercises.length, 0);
  if (exerciseCount === 0) throw new Error('Ho trovato i giorni ma nessun esercizio. Il formato del foglio è diverso da quello che conosco.');

  const totalWeeks = Math.max(...Object.keys(weekCols).map(Number));
  return {
    exerciseCount,
    warnings,
    program: {
      title,
      athlete,
      trainer,
      totalWeeks: Math.min(16, Math.max(1, totalWeeks)),
      days,
      guidelines: { modalitaEsecuzione: guide, progressione, cedimento },
      source: { tab, weekCols, annotate: true }
    }
  };
}

function nextHasWeeks(rows: string[][], from: number, end: number, cols: Record<number, number>): boolean {
  for (let i = from + 1; i < end; i++) {
    const r = rows[i] ?? [];
    if (!(r ?? []).some((c) => clean(c) !== '')) continue;
    return Object.values(cols).some((j) => clean(r[j]) !== '');
  }
  return false;
}

/**
 * Dopo aver riletto il foglio, mantiene gli id e i collegamenti alla libreria
 * degli esercizi già presenti (stesso nome), così lo storico resta agganciato.
 */
export function mergeWithPrevious(next: WorkoutProgram, previous: WorkoutProgram): WorkoutProgram {
  const key = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  const old = new Map(previous.days.flatMap((d) => d.exercises).map((e) => [key(e.name), e]));

  // prima gli esercizi riconosciuti, poi si assegnano id nuovi che non collidono
  const used = new Set<string>();
  const matched = next.days.map((d) =>
    d.exercises.map((e) => {
      const prev = old.get(key(e.name));
      if (prev && !used.has(prev.id)) {
        used.add(prev.id);
        return { ...e, id: prev.id, libraryId: e.libraryId ?? prev.libraryId, fresh: false };
      }
      return { ...e, fresh: true };
    })
  );
  let counter = 0;
  return {
    ...next,
    days: next.days.map((d, di) => ({
      ...d,
      exercises: matched[di].map(({ fresh, ...e }) => {
        if (!fresh) return e;
        let id = e.id;
        while (used.has(id)) id = `ex-n${++counter}`;
        used.add(id);
        return { ...e, id };
      })
    }))
  };
}
