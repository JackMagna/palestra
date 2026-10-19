import { describe, expect, it } from 'vitest';
import { describePrescription, parsePrescription, MAX_REPS_DEFAULT } from '../prescription';

describe('parsePrescription', () => {
  it('legge serie per ripetizioni', () => {
    expect(parsePrescription('3X10')).toMatchObject({ sets: 3, reps: [10, 10, 10], isMax: false, increaseWeight: false });
    expect(parsePrescription('4x8')).toMatchObject({ sets: 4, reps: [8, 8, 8, 8] });
  });
  it('riconosce l\'aumento di peso', () => {
    expect(parsePrescription('3X8 AUMENTO PESO')).toMatchObject({ sets: 3, reps: [8, 8, 8], increaseWeight: true });
  });
  it('legge le piramidi', () => {
    expect(parsePrescription('10-9-8..')).toMatchObject({ sets: 3, reps: [10, 9, 8] });
    expect(parsePrescription('12-10-8-6')).toMatchObject({ sets: 4, reps: [12, 10, 8, 6] });
  });
  it('legge le serie al massimo', () => {
    expect(parsePrescription('4xMAX')).toMatchObject({ sets: 4, isMax: true, reps: Array(4).fill(MAX_REPS_DEFAULT) });
  });
  it('usa un valore di riserva per testo vuoto o sconosciuto', () => {
    expect(parsePrescription('')).toMatchObject({ sets: 3, reps: [10, 10, 10] });
    expect(parsePrescription('a piacere')).toMatchObject({ sets: 3 });
  });
  it('limita le serie a un numero ragionevole', () => {
    expect(parsePrescription('99X5').sets).toBe(10);
    expect(parsePrescription('0X5').sets).toBe(1);
  });
});

describe('describePrescription', () => {
  it('produce testo leggibile', () => {
    expect(describePrescription('3X10')).toBe('3 × 10');
    expect(describePrescription('10-9-8..')).toBe('3 serie: 10, 9, 8');
    expect(describePrescription('4xMAX')).toBe('4 serie al massimo');
    expect(describePrescription('3X6 AUMENTO PESO')).toBe('3 × 6, aumenta il carico');
  });
});
