import { describe, expect, it } from 'vitest';
import { normalizeProgram, normalizeSession } from '../../services/normalize';
import { DEFAULT_PROGRAM } from '../../data/defaultProgram';
import { sessionToTCX } from '../tcx';
import { parseSpreadsheetId } from '../../services/googleSheets';

describe('normalizeSession', () => {
  it('converte le sessioni salvate dalla versione precedente', () => {
    const s = normalizeSession({
      sessionId: 'session-1', dayId: 'giorno-1', dayTitle: 'GIORNO 1', weekNumber: 2, durationMinutes: 50,
      totalVolumeKg: 800, date: '2026-09-01', createdAt: '2026-09-01T18:00:00.000Z',
      completedSets: [{ exerciseName: 'PRESSA 45', setIndex: 0, weightKg: 80, reps: 10 }]
    });
    expect(s.id).toBe('session-1');
    expect(s.sets).toEqual([{ exerciseId: '', exerciseName: 'PRESSA 45', setIndex: 0, weightKg: 80, reps: 10 }]);
    expect(s.endedAt - s.startedAt).toBe(50 * 60000);
  });
});

describe('normalizeProgram', () => {
  it('usa la scheda di partenza se i dati non sono validi', () => {
    expect(normalizeProgram(null).days).toHaveLength(DEFAULT_PROGRAM.days.length);
    expect(normalizeProgram({ days: [] }).title).toBe(DEFAULT_PROGRAM.title);
  });
  it('mantiene una scheda valida e converte le chiavi delle settimane in numeri', () => {
    const p = normalizeProgram({ ...DEFAULT_PROGRAM, days: [{ id: 'x', title: 'X', exercises: [{ id: 'e', name: 'E', sectionType: 'core', restTimeSec: 60, weeks: { '1': '4xMAX' } }] }] });
    expect(p.days[0].exercises[0].weeks[1]).toBe('4xMAX');
    expect(p.days[0].exercises[0].sectionType).toBe('core');
  });
});

describe('integrazioni', () => {
  it('genera un TCX valido', () => {
    const tcx = sessionToTCX(normalizeSession({ id: 's', date: '2026-09-01', startedAt: 1, endedAt: 3600_001, sets: [], avgBpm: 120, maxBpm: 160 }));
    expect(tcx).toContain('<TotalTimeSeconds>3600</TotalTimeSeconds>');
    expect(tcx).toContain('<AverageHeartRateBpm><Value>120</Value>');
  });
  it('estrae l\'ID dal link del foglio', () => {
    expect(parseSpreadsheetId('https://docs.google.com/spreadsheets/d/1AbC-xyz_9/edit#gid=0')).toBe('1AbC-xyz_9');
    expect(parseSpreadsheetId('  1AbC  ')).toBe('1AbC');
  });
});
