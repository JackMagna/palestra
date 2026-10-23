import { describe, expect, it } from 'vitest';
import { cellA1, inferStartDate, parseMeasuresTab, reconcileMeasures, weekDate, weekOfDate } from '../measuresSheet';
import type { Measurement } from '../../types';
import { MISURE } from './fixtures';

describe('parseMeasuresTab', () => {
  const { layout, values } = parseMeasuresTab(MISURE);
  it('trova settimane e righe', () => {
    expect(layout.weekCols).toEqual({ 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 });
    expect(layout.fieldRows).toEqual({ weightKg: 8, waistCm: 9, abdomenCm: 10, hipsCm: 11, armsCm: 12, thighsCm: 13 });
  });
  it('legge i valori, anche con la virgola', () => {
    expect(values).toEqual({ 1: { weightKg: 106, waistCm: 102, abdomenCm: 110, hipsCm: 114, armsCm: 39.5, thighsCm: 73 } });
  });
  it('calcola gli indirizzi delle celle', () => {
    expect(cellA1(layout, 2, 'weightKg')).toBe('C9');
    expect(cellA1(layout, 7, 'thighsCm')).toBe('H14');
    expect(cellA1(layout, 9, 'weightKg')).toBeNull();
    expect(cellA1(layout, 1, 'bodyFat')).toBeNull();
  });
  it('dà errori comprensibili', () => {
    expect(() => parseMeasuresTab([['Data', 'Peso']])).toThrow(/settimane/);
    expect(() => parseMeasuresTab([['SETTIMANE', '1 SETT.', '2 SETT.'], ['Altro', '1']])).toThrow(/PESO/);
  });
  it('ignora celle non numeriche', () => {
    const r = parseMeasuresTab([['SETTIMANE', '1 SETT.', '2 SETT.'], ['PESO', 'n.d.', '81,2']]);
    expect(r.values).toEqual({ 2: { weightKg: 81.2 } });
  });
});

describe('settimane e date', () => {
  it('associa date e settimane', () => {
    expect(weekDate('2026-10-05', 1)).toBe('2026-10-05');
    expect(weekDate('2026-10-05', 3)).toBe('2026-10-19');
    expect(weekOfDate('2026-10-05', '2026-10-05', 7)).toBe(1);
    expect(weekOfDate('2026-10-05', '2026-10-18', 7)).toBe(2);
    expect(weekOfDate('2026-10-05', '2026-10-19', 7)).toBe(3);
    expect(weekOfDate('2026-10-05', '2026-09-01', 7)).toBe(1); // prima dell'inizio
    expect(weekOfDate('2026-10-05', '2027-03-01', 7)).toBe(7); // dopo la fine
  });
  it('deduce l\'inizio dagli allenamenti', () => {
    const p = { startDate: undefined } as never;
    const s = (date: string, weekNumber: number) => ({ date, weekNumber }) as never;
    expect(inferStartDate(p, [s('2026-10-19', 3), s('2026-10-12', 2)], '2026-11-01')).toBe('2026-10-05');
    expect(inferStartDate(p, [], '2026-11-01')).toBe('2026-11-01');
    expect(inferStartDate({ startDate: '2026-09-28' } as never, [s('2026-10-19', 3)])).toBe('2026-09-28');
  });
});

describe('reconcileMeasures', () => {
  const { layout, values } = parseMeasuresTab(MISURE);
  const base = { layout, sheetValues: values, startDate: '2026-10-05', totalWeeks: 7 };

  it('importa dal foglio le settimane che l\'app non ha', () => {
    const r = reconcileMeasures({ ...base, measurements: [] });
    expect(r.add).toHaveLength(1);
    expect(r.add[0]).toMatchObject({ id: 'foglio-w1', week: 1, date: '2026-10-05', weightKg: 106, abdomenCm: 110, armsCm: 39.5, source: 'Foglio', sheetsSynced: true });
    expect(r.write).toEqual([]);
  });
  it('scrive nel foglio i valori dell\'app dove la cella è vuota', () => {
    const m: Measurement = { id: 'm1', date: '2026-10-14', weightKg: 104.5, hipsCm: 113 };
    const r = reconcileMeasures({ ...base, measurements: [m] });
    // settimana 2: foglio vuoto -> si scrive
    expect(r.write).toEqual([{ week: 2, field: 'weightKg', value: 104.5 }, { week: 2, field: 'hipsCm', value: 113 }]);
    expect(r.conflicts).toEqual([]);
  });
  it('segnala le differenze invece di sovrascrivere', () => {
    const m: Measurement = { id: 'm1', date: '2026-10-06', weightKg: 105.4, waistCm: 102 };
    const r = reconcileMeasures({ ...base, measurements: [m] });
    expect(r.conflicts).toEqual([{ week: 1, field: 'weightKg', sheetValue: 106, appValue: 105.4, measurementId: 'm1' }]);
    expect(r.write).toEqual([]); // vita uguale: niente da fare
  });
  it('completa la misura dell\'app con i campi che ha solo il foglio', () => {
    const m: Measurement = { id: 'm1', date: '2026-10-06', weightKg: 106 };
    const r = reconcileMeasures({ ...base, measurements: [m] });
    expect(r.fill).toEqual([{ id: 'm1', patch: { waistCm: 102, abdomenCm: 110, hipsCm: 114, armsCm: 39.5, thighsCm: 73 } }]);
  });
  it('usa la misura più recente della settimana e rispetta "week" esplicita', () => {
    const old: Measurement = { id: 'a', date: '2026-10-06', weightKg: 107 };
    const recent: Measurement = { id: 'b', date: '2026-10-09', weightKg: 106 };
    const r = reconcileMeasures({ ...base, measurements: [old, recent] });
    expect(r.conflicts).toEqual([]);
    const explicit: Measurement = { id: 'c', date: '2026-12-01', week: 4, weightKg: 100 };
    expect(reconcileMeasures({ ...base, measurements: [explicit] }).write).toEqual([{ week: 4, field: 'weightKg', value: 100 }]);
  });
  it('è stabile: rifarlo dopo aver applicato tutto non cambia più niente', () => {
    const first = reconcileMeasures({ ...base, measurements: [] });
    const second = reconcileMeasures({ ...base, measurements: first.add });
    expect(second).toEqual({ add: [], fill: [], write: [], conflicts: [] });
  });
});
