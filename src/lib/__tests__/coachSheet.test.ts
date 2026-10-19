import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeWithPrevious, parseCoachSheet, sentenceCase } from '../coachSheet';
import { annotatedCell, canOverwrite, colLetter, loadsText, planAnnotations } from '../sheetWrite';
import { suggestLibraryId } from '../exerciseMatch';
import { DEFAULT_PROGRAM } from '../../data/defaultProgram';
import type { WorkoutSession } from '../../types';
import { SHEET, row } from './fixtures';

describe('parseCoachSheet', () => {
  const { program, exerciseCount, warnings } = parseCoachSheet(SHEET, 'Scheda');

  it('legge titolo, atleta e trainer', () => {
    expect(program.title).toBe('Programma palestra');
    expect(program.athlete).toBe('Giacomo');
    expect(program.trainer).toBe('Dario personal trainer');
  });
  it('trova giorni, esercizi e settimane', () => {
    expect(program.days.map((d) => d.title)).toEqual(['Giorno 1', 'Giorno 2']);
    expect(exerciseCount).toBe(5);
    expect(program.totalWeeks).toBe(6);
    expect(warnings).toEqual([]);
    expect(program.days[0].exercises[0]).toMatchObject({ name: 'Chest press presa sopra', note: 'Presa orizzontale, petto alto', sheetRow: 8, restTimeSec: 120 });
    expect(program.days[0].exercises[0].weeks[3]).toBe('3X8 AUMENTO PESO');
  });
  it('assegna il tipo di lavoro dalle intestazioni di sezione', () => {
    expect(program.days[0].exercises.map((e) => e.sectionType)).toEqual(['progressione', 'progressione', 'cedimento']);
    expect(program.days[0].exercises[0].warmupNote).toBe('Fare 2 serie di avvicinamento carico');
  });
  it('riconosce il core dalle ripetizioni al massimo anche senza sezione', () => {
    const hyper = program.days[1].exercises[1];
    expect(hyper.sectionType).toBe('progressione'); // dentro una sezione "progressione" vale quella del coach
    const alone = parseCoachSheet([row('GIORNO 1', 'NOTE', '1 SETT.'), row('PLANK', '', '4xMAX')]);
    expect(alone.program.days[0].exercises[0].sectionType).toBe('core');
  });
  it('ricorda le colonne delle settimane e le righe', () => {
    expect(program.source).toEqual({ tab: 'Scheda', annotate: true, weekCols: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 } });
  });
  it('legge le indicazioni finali', () => {
    expect(program.guidelines.modalitaEsecuzione).toHaveLength(2);
    expect(program.guidelines.progressione).toContain('aumentarlo');
    expect(program.guidelines.cedimento).toContain('cedimento tecnico');
  });
  it('dà errori comprensibili se il foglio è un altro', () => {
    expect(() => parseCoachSheet([row('Data', 'Peso')])).toThrow(/GIORNO/);
    expect(() => parseCoachSheet([row('GIORNO 1', 'NOTE', '1 SETT.')])).toThrow(/nessun esercizio/);
  });
  it('maiuscole solo se il testo è tutto maiuscolo', () => {
    expect(sentenceCase('LEG CURL SEDUTO')).toBe('Leg curl seduto');
    expect(sentenceCase('Pressa 45°')).toBe('Pressa 45°');
    expect(sentenceCase('45')).toBe('45');
  });
});

describe('mergeWithPrevious', () => {
  it('mantiene id e collegamento alla libreria degli esercizi con lo stesso nome', () => {
    const { program } = parseCoachSheet(SHEET, 'Scheda');
    const merged = mergeWithPrevious(program, DEFAULT_PROGRAM);
    const ids = merged.days.flatMap((d) => d.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    const croci = merged.days[0].exercises[2];
    expect(croci.id).toBe('ex-1-3');
    expect(croci.libraryId).toBe('Cable_Crossover');
  });
  it('non crea id doppi quando l\'ordine cambia', () => {
    const { program } = parseCoachSheet(SHEET, 'Scheda');
    const shuffled = { ...program, days: [{ ...program.days[0], exercises: [...program.days[0].exercises].reverse() }, program.days[1]] };
    const merged = mergeWithPrevious(shuffled, DEFAULT_PROGRAM);
    const ids = merged.days.flatMap((d) => d.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('scrittura nella griglia', () => {
  it('converte le colonne in lettere', () => {
    expect(colLetter(0)).toBe('A');
    expect(colLetter(2)).toBe('C');
    expect(colLetter(25)).toBe('Z');
    expect(colLetter(26)).toBe('AA');
    expect(colLetter(27)).toBe('AB');
  });
  it('formatta i carichi', () => {
    expect(loadsText([{ weightKg: 40, setIndex: 0 }, { weightKg: 40, setIndex: 1 }])).toBe('40 kg');
    expect(loadsText([{ weightKg: 42.5, setIndex: 1 }, { weightKg: 40, setIndex: 0 }])).toBe('40/42,5 kg');
    expect(loadsText([])).toBe('');
    expect(annotatedCell('3X10', '40 kg')).toBe('3X10 · 40 kg');
  });
  it('non sovrascrive celle cambiate dal coach', () => {
    expect(canOverwrite('', '3X10')).toBe(true);
    expect(canOverwrite('3X10', '3X10')).toBe(true);
    expect(canOverwrite('3x10 · 40 kg', '3X10')).toBe(true);
    expect(canOverwrite('4X12 nuova indicazione', '3X10')).toBe(false);
  });
  it('pianifica le celle giuste: settimana, colonna e riga', () => {
    const { program } = parseCoachSheet(SHEET, 'Scheda');
    const session = {
      id: 's', date: '2026-10-19', startedAt: 1, endedAt: 2, dayId: 'giorno-1', dayTitle: 'Giorno 1', weekNumber: 3,
      durationMinutes: 50, totalVolumeKg: 0,
      sets: [
        { exerciseId: 'ex-1-1', exerciseName: 'Chest press presa sopra', setIndex: 0, weightKg: 40, reps: 8 },
        { exerciseId: '', exerciseName: 'REMATORE AL PULLEY TRIANGOLO', setIndex: 0, weightKg: 35, reps: 8 },
        { exerciseId: '', exerciseName: 'Esercizio che non è in scheda', setIndex: 0, weightKg: 10, reps: 8 }
      ]
    } satisfies WorkoutSession;
    const plans = planAnnotations(program, session);
    expect(plans.map((p) => [p.a1, p.value])).toEqual([
      ['E8', '3X8 AUMENTO PESO · 40 kg'],
      ['E9', '3X8 AUMENTO PESO · 35 kg']
    ]);
    expect(planAnnotations({ ...program, source: undefined }, session)).toEqual([]);
  });
});

describe('suggerimento dalla libreria', () => {
  const lib = JSON.parse(readFileSync(new URL('../../../public/data/exercises.json', import.meta.url), 'utf8'));
  const cases: [string, string][] = [
    ['Pressa 45°', 'Leg_Press'],
    ['Leg curl seduto', 'Seated_Leg_Curl'],
    ['Curl bilanciere', 'Barbell_Curl'],
    ['Hyperextension', 'Hyperextensions_Back_Extensions'],
    ['Reverse crunch declinata', 'Decline_Reverse_Crunch']
  ];
  it.each(cases)('%s -> %s', (name, id) => expect(suggestLibraryId(name, lib)).toBe(id));
  it('non inventa un collegamento se non c\'è somiglianza', () => {
    expect(suggestLibraryId('Esercizio misterioso xyz', lib)).toBeUndefined();
  });
});
