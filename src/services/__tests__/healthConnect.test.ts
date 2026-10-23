import { describe, expect, it } from 'vitest';
import { samplesToBody, samplesToHeartRate } from '../healthConnect';

const at = (y: number, m: number, d: number, h = 8) => new Date(y, m - 1, d, h).toISOString();

describe('conversione dati di Health Connect', () => {
  it('unisce peso e massa grassa per giorno e ordina', () => {
    const out = samplesToBody(
      [{ value: 80.04, startDate: at(2026, 10, 12) }, { value: 81.2, startDate: at(2026, 10, 5) }, { value: 79.96, startDate: at(2026, 10, 12, 20) }],
      [{ value: 14.26, startDate: at(2026, 10, 12) }]
    );
    expect(out).toEqual([{ date: '2026-10-05', weightKg: 81.2, bodyFat: undefined }, { date: '2026-10-12', weightKg: 80, bodyFat: 14.3 }]);
  });
  it('calcola frequenza media e massima, ignorando valori impossibili', () => {
    const hr = samplesToHeartRate([60, 90, 120, 150, 0, 400].map((value, i) => ({ value, startDate: at(2026, 10, 12, 8 + i) })));
    expect(hr).toEqual({ avg: 105, max: 150 });
    expect(samplesToHeartRate([])).toBeNull();
  });
});
