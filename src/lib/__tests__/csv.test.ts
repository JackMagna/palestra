import { describe, expect, it } from 'vitest';
import { csvCell, programCSV, toCSV } from '../csv';
import { DEFAULT_PROGRAM } from '../../data/defaultProgram';

describe('csv', () => {
  it('protegge virgole e virgolette', () => {
    expect(csvCell('gomiti fermi, niente oscillazioni')).toBe('"gomiti fermi, niente oscillazioni"');
    expect(csvCell('presa "sopra"')).toBe('"presa ""sopra"""');
    expect(csvCell(undefined)).toBe('');
  });
  it('mantiene il numero di colonne anche con note che contengono virgole', () => {
    const csv = toCSV([['a', 'b, c', 'd']]);
    expect(csv).toBe('a,"b, c",d');
  });
  it('esporta la scheda con tutte le settimane', () => {
    const csv = programCSV(DEFAULT_PROGRAM);
    expect(csv).toContain('Sett. 6');
    expect(csv).toContain('Pressa 45°');
    expect(csv).toContain('3X8 AUMENTO PESO');
  });
});
