import type { Measurement, WorkoutProgram, WorkoutSession } from '../types';
import { canOverwrite, planAnnotations } from '../lib/sheetWrite';
import { parseMeasuresTab, type MeasuresLayout, type SheetValues } from '../lib/measuresSheet';
import { programRows } from '../lib/csv';
import { GoogleTokenExpiredError } from './firebase';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
const LOG_SHEET = 'Log carichi';
const LOG_HEADER = ['Data', 'Giorno', 'Settimana', 'Esercizio', 'Serie', 'Peso (kg)', 'Ripetizioni', 'Volume (kg)'];

async function call<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
  });
  if (res.status === 401) throw new GoogleTokenExpiredError();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message ?? res.statusText;
    if (res.status === 403) throw new Error("Non hai il permesso di modificare questo foglio. Chiedi al coach di condividerlo con te come “Editor”.");
    if (res.status === 404) throw new Error('Foglio non trovato. Controlla il link o l\'ID del foglio.');
    throw new Error(`Errore Google Sheets (${res.status}): ${msg}`);
  }
  return res.json() as Promise<T>;
}

/** Accetta sia il link completo sia l'ID del foglio */
export function parseSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}

export function spreadsheetUrl(id: string) {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

export async function createSpreadsheetFromProgram(token: string, program: WorkoutProgram) {
  const rows = programRows(program);
  const result = await call<{ spreadsheetId: string; spreadsheetUrl: string }>(token, API, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: `${program.title} – ${program.athlete}` },
      sheets: [
        {
          properties: { title: 'Scheda', gridProperties: { frozenRowCount: 0 } },
          data: [{ startRow: 0, startColumn: 0, rowData: rows.map((r) => ({ values: r.map((c) => ({ userEnteredValue: { stringValue: c } })) })) }]
        },
        {
          properties: { title: LOG_SHEET, gridProperties: { frozenRowCount: 1 } },
          data: [{ startRow: 0, startColumn: 0, rowData: [{ values: LOG_HEADER.map((c) => ({ userEnteredValue: { stringValue: c } })) }] }]
        }
      ]
    })
  });
  return result;
}

// Se il foglio ha già una scheda MISURE (maiuscole comprese) questa serve solo come ripiego.
const MEASURE_SHEET = 'Misure app';
const MEASURE_HEADER = ['Data', 'Settimana', 'Peso (kg)', 'Grasso (%)', 'Petto (cm)', 'Vita (cm)', 'Addome (cm)', 'Fianchi (cm)', 'Braccio (cm)', 'Coscia (cm)', 'Note'];

const quote = (title: string) => `'${title.replace(/'/g, "''")}'`;

/** Crea la scheda (tab) con l'intestazione se non esiste. Non tocca le altre schede del foglio. */
async function ensureTab(token: string, spreadsheetId: string, title: string, header: string[]) {
  const meta = await call<{ sheets: { properties: { title: string } }[] }>(token, `${API}/${spreadsheetId}?fields=sheets.properties.title`);
  // Google considera uguali "MISURE" e "Misure": il confronto va fatto senza maiuscole
  if (meta.sheets.some((s) => s.properties.title.toLowerCase() === title.toLowerCase())) return;
  await call(token, `${API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] })
  });
  await call(token, `${API}/${spreadsheetId}/values/${encodeURIComponent(`${quote(title)}!A1`)}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [header] })
  });
}

/** Nomi delle schede (tab) di un foglio, per scegliere quella con la scheda del coach. */
export async function listTabs(token: string, spreadsheetId: string): Promise<string[]> {
  const meta = await call<{ sheets: { properties: { title: string } }[] }>(
    token,
    `${API}/${spreadsheetId}?fields=sheets.properties.title`
  );
  return meta.sheets.map((s) => s.properties.title);
}

/** Legge le celle di una scheda così come le vedi nel foglio. */
export async function readTab(token: string, spreadsheetId: string, tab: string): Promise<string[][]> {
  const res = await call<{ values?: string[][] }>(
    token,
    `${API}/${spreadsheetId}/values/${encodeURIComponent(quote(tab))}?valueRenderOption=FORMATTED_VALUE`
  );
  return res.values ?? [];
}

/** Aggiunge le serie delle sessioni al foglio "Log carichi". Numeri come numeri, non come testo. */
export async function appendSessions(token: string, spreadsheetId: string, sessions: WorkoutSession[]) {
  if (!sessions.length) return;
  await ensureTab(token, spreadsheetId, LOG_SHEET, LOG_HEADER);
  const values = sessions.flatMap((s) =>
    s.sets.map((set) => [s.date, s.dayTitle, s.weekNumber, set.exerciseName, set.setIndex + 1, set.weightKg, set.reps, set.weightKg * set.reps])
  );
  await call(
    token,
    `${API}/${spreadsheetId}/values/${encodeURIComponent(`'${LOG_SHEET}'!A:H`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values }) }
  );
}

/** Aggiunge le misure alla scheda "Misure" dello stesso foglio. */
export async function appendMeasurements(token: string, spreadsheetId: string, items: Measurement[]) {
  if (!items.length) return;
  await ensureTab(token, spreadsheetId, MEASURE_SHEET, MEASURE_HEADER);
  const values = items.map((m) => [m.date, m.week ?? '', m.weightKg ?? '', m.bodyFat ?? '', m.chestCm ?? '', m.waistCm ?? '', m.abdomenCm ?? '', m.hipsCm ?? '', m.armsCm ?? '', m.thighsCm ?? '', m.notes ?? '']);
  await call(
    token,
    `${API}/${spreadsheetId}/values/${encodeURIComponent(`${quote(MEASURE_SHEET)}!A:K`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values }) }
  );
}

/**
 * Scrive i carichi nella griglia del coach, accanto alla prescrizione ("3X10 · 40 kg").
 * Prima legge le celle e scrive solo dove c'è ancora la prescrizione originale (o una nostra nota):
 * se il coach ha cambiato la cella, la lascia stare.
 */
export async function annotateGrid(
  token: string,
  spreadsheetId: string,
  program: WorkoutProgram,
  sessions: WorkoutSession[]
): Promise<{ written: number; skipped: number }> {
  const tab = program.source?.tab;
  if (!tab) return { written: 0, skipped: 0 };
  // in ordine di data: se due allenamenti toccano la stessa cella vince il più recente
  const latest = new Map<string, ReturnType<typeof planAnnotations>[number]>();
  [...sessions].sort((a, b) => a.startedAt - b.startedAt).forEach((s) => planAnnotations(program, s).forEach((p) => latest.set(p.a1, p)));
  const plans = [...latest.values()];
  if (!plans.length) return { written: 0, skipped: 0 };

  const ranges = plans.map((p) => `${quote(tab)}!${p.a1}`);
  const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  const current = await call<{ valueRanges: { values?: string[][] }[] }>(token, `${API}/${spreadsheetId}/values:batchGet?${query}&valueRenderOption=FORMATTED_VALUE`);
  const writable = plans.filter((p, i) => canOverwrite(current.valueRanges[i]?.values?.[0]?.[0] ?? '', p.prescription, p.mode));
  if (writable.length) {
    await call(token, `${API}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: writable.map((p) => ({ range: `${quote(tab)}!${p.a1}`, values: [[p.value]] }))
      })
    });
  }
  return { written: writable.length, skipped: plans.length - writable.length };
}

/** La scheda delle misure del coach: quella che si chiama MISURE (o simile). */
export const findMeasuresTab = (tabs: string[]) => tabs.find((t) => /misure/i.test(t) && !/app$/i.test(t.trim()));

/** Legge la scheda MISURE del coach: dove stanno settimane e righe, e i valori già inseriti. */
export async function readMeasures(token: string, spreadsheetId: string, tab: string): Promise<{ layout: MeasuresLayout; values: SheetValues }> {
  return parseMeasuresTab(await readTab(token, spreadsheetId, tab));
}

/** Scrive singole celle numeriche (come numeri veri, non testo). */
export async function writeMeasureCells(token: string, spreadsheetId: string, tab: string, cells: { a1: string; value: number }[]) {
  if (!cells.length) return;
  await call(token, `${API}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: cells.map((c) => ({ range: `${quote(tab)}!${c.a1}`, values: [[c.value]] }))
    })
  });
}
