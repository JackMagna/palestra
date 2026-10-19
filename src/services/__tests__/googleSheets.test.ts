import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHEET } from '../../lib/__tests__/fixtures';
import { parseCoachSheet } from '../../lib/coachSheet';
import type { Measurement, WorkoutSession } from '../../types';

vi.mock('../firebase', () => ({ GoogleTokenExpiredError: class extends Error {} }));
const { annotateGrid, appendMeasurements, appendSessions, listTabs, readTab } = await import('../googleSheets');

/** Un Google Sheets finto in memoria, con solo le chiamate che usa l'app. */
function fakeSheets(initial: Record<string, string[][]>) {
  const tabs = new Map<string, string[][]>(Object.entries(initial).map(([k, v]) => [k, v.map((r) => [...r])]));
  const calls: string[] = [];
  const cellOf = (range: string) => {
    const [tab, a1] = range.split('!');
    const m = a1.match(/^([A-Z]+)(\d+)$/)!;
    const col = [...m[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
    return { tab: tab.replace(/^'|'$/g, '').replace(/''/g, "'"), row: Number(m[2]) - 1, col };
  };
  vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const path = decodeURIComponent(url.pathname.replace('/v4/spreadsheets/', ''));
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : {};
    calls.push(`${method} ${path.split('/').slice(1).join('/')}`);
    const ok = (json: unknown) => ({ ok: true, status: 200, json: async () => json });

    if (method === 'GET' && path.endsWith('values:batchGet')) {
      const ranges = url.searchParams.getAll('ranges');
      return ok({ valueRanges: ranges.map((r) => { const c = cellOf(r); const v = tabs.get(c.tab)?.[c.row]?.[c.col]; return { values: v === undefined || v === '' ? undefined : [[v]] }; }) });
    }
    if (method === 'POST' && path.endsWith('values:batchUpdate')) {
      for (const d of body.data) {
        const c = cellOf(d.range);
        const grid = tabs.get(c.tab)!;
        while (grid.length <= c.row) grid.push([]);
        while (grid[c.row].length <= c.col) grid[c.row].push('');
        grid[c.row][c.col] = d.values[0][0];
      }
      return ok({});
    }
    if (method === 'POST' && path.endsWith(':batchUpdate')) {
      for (const r of body.requests) tabs.set(r.addSheet.properties.title, []);
      return ok({});
    }
    if (method === 'PUT') { const c = cellOf(path.split('/values/')[1]); tabs.set(c.tab, [...body.values]); return ok({}); }
    if (method === 'POST' && path.includes(':append')) {
      const tab = path.split('/values/')[1].replace(':append', '').split('!')[0].replace(/^'|'$/g, '').replace(/''/g, "'");
      tabs.get(tab)!.push(...body.values);
      return ok({});
    }
    if (method === 'GET' && path.includes('/values/')) return ok({ values: tabs.get(path.split('/values/')[1].replace(/^'|'$/g, '')) });
    if (method === 'GET') return ok({ sheets: [...tabs.keys()].map((title) => ({ properties: { title } })) });
    return { ok: false, status: 404, statusText: 'x', json: async () => ({}) };
  }));
  return { tabs, calls };
}

const program = parseCoachSheet(SHEET, 'Scheda').program;
const session = (weight: number, over: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 's1', date: '2026-10-19', startedAt: 1, endedAt: 2, dayId: 'giorno-1', dayTitle: 'Giorno 1', weekNumber: 3,
  durationMinutes: 50, totalVolumeKg: 0,
  sets: [
    { exerciseId: 'ex-1-1', exerciseName: 'Chest press presa sopra', setIndex: 0, weightKg: weight, reps: 8 },
    { exerciseId: 'ex-1-1', exerciseName: 'Chest press presa sopra', setIndex: 1, weightKg: weight + 2.5, reps: 8 }
  ],
  ...over
});

let fake: ReturnType<typeof fakeSheets>;
beforeEach(() => { fake = fakeSheets({ Scheda: SHEET, Altro: [['x']] }); });

describe('lettura', () => {
  it('elenca le schede e legge le celle', async () => {
    expect(await listTabs('t', 'ID')).toEqual(['Scheda', 'Altro']);
    expect((await readTab('t', 'ID', 'Scheda'))[5][0]).toBe('GIORNO 1');
  });
});

describe('scrittura', () => {
  it('scrive i carichi accanto alla prescrizione del coach', async () => {
    const res = await annotateGrid('t', 'ID', program, [session(40)]);
    expect(res).toEqual({ written: 1, skipped: 0 });
    expect(fake.tabs.get('Scheda')![7][4]).toBe('3X8 AUMENTO PESO · 40/42,5 kg');
    expect(fake.tabs.get('Scheda')![7][0]).toBe('CHEST PRESS PRESA SOPRA'); // il resto non si tocca
  });
  it('aggiorna la propria nota alla seduta successiva', async () => {
    await annotateGrid('t', 'ID', program, [session(40)]);
    await annotateGrid('t', 'ID', program, [session(42.5, { id: 's2', startedAt: 5 })]);
    expect(fake.tabs.get('Scheda')![7][4]).toBe('3X8 AUMENTO PESO · 42,5/45 kg');
  });
  it('lascia stare le celle cambiate dal coach', async () => {
    fake.tabs.get('Scheda')![7][4] = 'ora fai 5x5 a 60 kg';
    const res = await annotateGrid('t', 'ID', program, [session(40)]);
    expect(res).toEqual({ written: 0, skipped: 1 });
    expect(fake.tabs.get('Scheda')![7][4]).toBe('ora fai 5x5 a 60 kg');
  });
  it('non fa niente se la scheda non arriva da un foglio', async () => {
    expect(await annotateGrid('t', 'ID', { ...program, source: undefined }, [session(40)])).toEqual({ written: 0, skipped: 0 });
    expect(fake.calls).toEqual([]);
  });
  it('crea "Log carichi" con l\'intestazione e righe numeriche', async () => {
    await appendSessions('t', 'ID', [session(40)]);
    const log = fake.tabs.get('Log carichi')!;
    expect(log[0][0]).toBe('Data');
    expect(log[1]).toEqual(['2026-10-19', 'Giorno 1', 3, 'Chest press presa sopra', 1, 40, 8, 320]);
    await appendSessions('t', 'ID', [session(50, { id: 's2' })]);
    expect(fake.tabs.get('Log carichi')!).toHaveLength(5); // intestazione + 2 + 2, senza rifare l'intestazione
  });
  it('aggiunge le misure nella scheda "Misure" dello stesso foglio', async () => {
    const m: Measurement = { id: 'm1', date: '2026-10-19', weightKg: 80.4, waistCm: 84 };
    await appendMeasurements('t', 'ID', [m]);
    const t = fake.tabs.get('Misure')!;
    expect(t[0]).toContain('Peso (kg)');
    expect(t[1]).toEqual(['2026-10-19', 80.4, '', '', 84, '', '', '']);
    expect(fake.tabs.get('Scheda')).toEqual(SHEET); // la scheda del coach resta identica
  });
});
