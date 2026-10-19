import { describe, expect, it } from 'vitest';
import { isValidDraft } from '../../components/workout/draft';

const good = {
  dayId: 'giorno-1', week: 1, startedAt: null, exIndex: 0, setIndex: 0,
  hr: { sum: 0, count: 0, max: 0 },
  sets: { 'ex-1-1': [{ weightKg: 20, reps: 10, completed: false }] }
};

describe('isValidDraft', () => {
  it('accetta una bozza corretta', () => {
    expect(isValidDraft(good)).toBe(true);
    expect(isValidDraft({ ...good, startedAt: 1234 })).toBe(true);
  });
  it('scarta bozze rovinate o di una versione diversa', () => {
    expect(isValidDraft(null)).toBe(false);
    expect(isValidDraft('x')).toBe(false);
    expect(isValidDraft({ ...good, sets: null })).toBe(false);
    expect(isValidDraft({ ...good, sets: { a: 'no' } })).toBe(false);
    expect(isValidDraft({ ...good, sets: { a: [{ weightKg: '20', reps: 10, completed: false }] } })).toBe(false);
    expect(isValidDraft({ ...good, hr: undefined })).toBe(false);
    expect(isValidDraft({ ...good, week: 'uno' })).toBe(false);
    const { dayId: _d, ...noDay } = good;
    expect(isValidDraft(noDay)).toBe(false);
  });
});
