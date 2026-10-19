import { describe, expect, it } from 'vitest';
import type { WorkoutSession } from '../../types';
import { estimateOneRepMax, exerciseTrend, isPersonalRecord, lastSetsFor, personalBest, volumeOf } from '../stats';

const session = (id: string, startedAt: number, sets: [string, number, number][]): WorkoutSession => ({
  id, date: new Date(startedAt).toISOString().slice(0, 10), startedAt, endedAt: startedAt + 3600_000,
  dayId: 'giorno-1', dayTitle: 'Giorno 1', weekNumber: 1, durationMinutes: 60, totalVolumeKg: 0,
  sets: sets.map(([exerciseId, weightKg, reps], setIndex) => ({ exerciseId, exerciseName: exerciseId.toUpperCase(), setIndex, weightKg, reps }))
});

const s1 = session('a', Date.UTC(2026, 8, 1), [['press', 40, 10], ['press', 40, 9], ['curl', 15, 10]]);
const s2 = session('b', Date.UTC(2026, 8, 4), [['press', 45, 8], ['press', 45, 8]]);

describe('stats', () => {
  it('calcola il volume', () => {
    expect(volumeOf([{ weightKg: 40, reps: 10 }, { weightKg: 42.5, reps: 8 }])).toBe(740);
  });
  it('stima il massimale con Epley', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 10)).toBe(133.3);
    expect(estimateOneRepMax(0, 10)).toBe(0);
  });
  it('trova le serie dell\'ultima sessione', () => {
    expect(lastSetsFor([s1, s2], 'press').map((s) => s.weightKg)).toEqual([45, 45]);
    expect(lastSetsFor([s1, s2], 'curl').map((s) => s.weightKg)).toEqual([15]);
    expect(lastSetsFor([s1, s2], 'squat')).toEqual([]);
  });
  it('riconosce l\'esercizio anche per nome (sessioni della vecchia versione)', () => {
    const legacy = { ...s1, sets: s1.sets.map((s) => ({ ...s, exerciseId: '' })) };
    expect(lastSetsFor([legacy], 'nuovo-id', 'press')).toHaveLength(2);
  });
  it('calcola record e andamento', () => {
    expect(personalBest([s1, s2], 'press')).toMatchObject({ weightKg: 45, reps: 8 });
    expect(exerciseTrend([s2, s1], 'press').map((p) => p.value)).toEqual([53.3, 57]);
    expect(isPersonalRecord([s1, s2], 'press', 'PRESS', 50, 8)).toBe(true);
    expect(isPersonalRecord([s1, s2], 'press', 'PRESS', 40, 5)).toBe(false);
    expect(isPersonalRecord([], 'press', 'PRESS', 40, 5)).toBe(false);
  });
});
