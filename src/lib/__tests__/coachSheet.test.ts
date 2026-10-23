import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeWithPrevious, parseCoachSheet, sentenceCase } from '../coachSheet';
import { annotatedCell, canOverwrite, colLetter, loadsText, planAnnotations } from '../sheetWrite';
import { suggestLibraryId } from '../exerciseMatch';
import { DEFAULT_PROGRAM } from '../../data/defaultProgram';
import type { WorkoutSession } from '../../types';
import { SHEET, row } from './fixtures';

describe('parseCoachSheet (struttura vera del foglio)', () => {
  const { program, exerciseCount, warnings } = parseCoachSheet(SHEET, 'ALLENAMENTO');
  const d1 = program.days[0].exercises;
  const d2 = program.days[1].exercises;

  it('legge titolo, atleta e trainer', () => {
    expect(program.title).toBe('Programma palestra');
    expect(program.athlete).toBe('Giacomo');
    expect(program.trainer).toBe('Dario personal trainer');
  });
  it('trova 2 giorni, 14 esercizi e 6 settimane', () => {
    expect(program.days.map((d) => d.title)).toEqual(['Giorno 1', 'Giorno 2']);
    expect(exerciseCount).toBe(14);
    expect(d1).toHaveLength(7);
    expect(d2).toHaveLength(7);
    expect(program.totalWeeks).toBe(6);
    expect(warnings).toEqual([]);
  });
  it('gli esercizi ereditano la prescrizione dall\'intestazione di sezione', () => {
    expect(d1[0]).toMatchObject({ name: 'Chest press presa sopra', sheetRow: 9, sectionType: 'progressione', cellMode: 'loads', restTimeSec: 120 });
    expect(d1[0].weeks).toEqual({ 1: '3X10', 2: '4X10', 3: '3X8 AUMENTO PESO', 4: '4X8', 5: '3X6 AUMENTO PESO', 6: '4X6' });
    expect(d1[2]).toMatchObject({ name: 'Croci ai cavi alti', sheetRow: 12, sectionType: 'cedimento' });
    expect(d1[2].weeks[1]).toBe('10-9-8..');
  });
  it('la seconda sezione PROGRESSIONE del giorno vale per l\'esercizio sotto di lei', () => {
    expect(d1.map((e) => [e.name, e.sectionType, e.sheetRow])).toEqual([
      ['Chest press presa sopra', 'progressione', 9], ['Rematore al pulley triangolo', 'progressione', 10],
      ['Croci ai cavi alti', 'cedimento', 12], ['Trazioni al pull down machine', 'cedimento', 13],
      ['Lento manubri panca 70', 'progressione', 15], ['Alzate laterali prono panca 60', 'cedimento', 17],
      ['Revers crunch declinata', 'core', 18]
    ]);
  });
  it('l\'addome ha la prescrizione sulla propria riga, senza sezione', () => {
    expect(d1[6]).toMatchObject({ sectionType: 'core', restTimeSec: 90, sheetRow: 18 });
    expect(d1[6].cellMode).toBeUndefined();
    expect(d1[6].weeks[3]).toBe('4xMAX');
    expect(d1[6].warmupNote).toBeUndefined(); // niente "riscaldamento" della sezione cedimento
    expect(d2[6]).toMatchObject({ name: 'Hiperextension', sectionType: 'core', sheetRow: 30 });
  });
  it('legge note e riscaldamento', () => {
    expect(d1[0].warmupNote).toBe('Fare 2 serie di avvicinamento carico');
    expect(d1[1].note).toBe('Adduzione scapolare');
    expect(d1[3].note).toBe('Focus dorsali');
    expect(d2[0].warmupNote).toBe('Fare 2 serie di avviciamento carico');
  });
  it('ricorda le colonne delle settimane', () => {
    expect(program.source).toEqual({ tab: 'ALLENAMENTO', annotate: true, weekCols: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 } });
  });
  it('legge le indicazioni finali', () => {
    expect(program.guidelines.modalitaEsecuzione).toEqual(['Fare 3 allenamenti a settimana alternando i due giorni', 'Fare movimenti controllati']);
    expect(program.guidelines.progressione).toContain('aumentarlo');
    expect(program.guidelines.cedimento).toContain('cedimento tecnico');
  });
  it('rileggere il foglio dopo che l\'app ci ha scritto i carichi non li scambia per prescrizioni', () => {
    const written = SHEET.map((r) => [...r]);
    written[8] = ['CHEST PRESS PRESA SOPRA', '', '40 kg', '', '40/42,5 kg'];       // carichi scritti dall'app
    written[9] = ['REMATORE AL PULLEY TRIANGOLO', 'adduzione scapolare', '35', '36']; // carichi scritti a mano
    written[17] = ['REVERS CRUNCH DECLINATA', '', '4xMAX · 15/14/13/12 rip', '4xMAX', '4xMAX', '4xMAX', '4xMAX', '4xMAX'];
    const again = parseCoachSheet(written, 'ALLENAMENTO').program.days[0].exercises;
    expect(again[0].weeks).toEqual(d1[0].weeks);
    expect(again[0].cellMode).toBe('loads');
    expect(again[1].weeks).toEqual(d1[1].weeks);
    expect(again[6].weeks[1]).toBe('4xMAX');
    expect(again[6].sectionType).toBe('core');
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
    const { program } = parseCoachSheet(SHEET, 'ALLENAMENTO');
    const merged = mergeWithPrevious(program, DEFAULT_PROGRAM);
    const ids = merged.days.flatMap((d) => d.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    const croci = merged.days[0].exercises[2];
    expect(croci.id).toBe('ex-1-3');
    expect(croci.libraryId).toBe('Cable_Crossover');
  });
  it('non crea id doppi quando l\'ordine cambia', () => {
    const { program } = parseCoachSheet(SHEET, 'ALLENAMENTO');
    const shuffled = { ...program, days: [{ ...program.days[0], exercises: [...program.days[0].exercises].reverse() }, program.days[1]] };
    const ids = mergeWithPrevious(shuffled, DEFAULT_PROGRAM).days.flatMap((d) => d.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('scrittura nella griglia', () => {
  it('converte le colonne in lettere', () => {
    expect(['A', 'C', 'Z', 'AA', 'AB'].map((_, i) => colLetter([0, 2, 25, 26, 27][i]))).toEqual(['A', 'C', 'Z', 'AA', 'AB']);
  });
  it('formatta i carichi', () => {
    expect(loadsText([{ weightKg: 40, setIndex: 0 }, { weightKg: 40, setIndex: 1 }])).toBe('40 kg');
    expect(loadsText([{ weightKg: 42.5, setIndex: 1 }, { weightKg: 40, setIndex: 0 }])).toBe('40/42,5 kg');
    expect(annotatedCell('4xMAX', '15/14 rip')).toBe('4xMAX · 15/14 rip');
  });
  it('nelle celle dei carichi si aggiorna solo ciò che ha scritto l\'app', () => {
    expect(canOverwrite('', '3X10', 'loads')).toBe(true);
    expect(canOverwrite('40 kg', '3X10', 'loads')).toBe(true);
    expect(canOverwrite('40/42,5 kg', '3X10', 'loads')).toBe(true);
    expect(canOverwrite('ho fatto fatica', '3X10', 'loads')).toBe(false);
  });
  it('nelle celle con prescrizione (addome) si aggiunge solo dopo la prescrizione', () => {
    expect(canOverwrite('4xMAX', '4xMAX')).toBe(true);
    expect(canOverwrite('4xMAX · 15/14 rip', '4xMAX')).toBe(true);
    expect(canOverwrite('4x12 nuova indicazione', '4xMAX')).toBe(false);
    expect(canOverwrite('4xMAX e basta', '4xMAX')).toBe(false);
  });
  it('pianifica le celle giuste: settimana, colonna e riga', () => {
    const { program } = parseCoachSheet(SHEET, 'ALLENAMENTO');
    const mk = (weekNumber: number, sets: WorkoutSession['sets']): WorkoutSession => ({ id: 's', date: '2026-10-19', startedAt: 1, endedAt: 2, dayId: 'giorno-1', dayTitle: 'Giorno 1', weekNumber, durationMinutes: 50, totalVolumeKg: 0, sets });
    const session = mk(3, [
      { exerciseId: 'ex-1-1', exerciseName: 'Chest press presa sopra', setIndex: 0, weightKg: 40, reps: 8 },
      { exerciseId: 'ex-1-1', exerciseName: 'Chest press presa sopra', setIndex: 1, weightKg: 42.5, reps: 8 },
      { exerciseId: '', exerciseName: 'REMATORE AL PULLEY TRIANGOLO', setIndex: 0, weightKg: 35, reps: 8 },
      { exerciseId: '', exerciseName: 'REVERS CRUNCH DECLINATA', setIndex: 0, weightKg: 0, reps: 15 },
      { exerciseId: '', exerciseName: 'REVERS CRUNCH DECLINATA', setIndex: 1, weightKg: 0, reps: 14 },
      { exerciseId: '', exerciseName: 'Esercizio che non è in scheda', setIndex: 0, weightKg: 10, reps: 8 }
    ]);
    expect(planAnnotations(program, session).map((p) => [p.a1, p.value])).toEqual([
      ['E9', '40/42,5 kg'],            // cella vuota dei carichi, settimana 3 = colonna E
      ['E10', '35 kg'],
      ['E18', '4xMAX · 15/14 rip']     // addome: prescrizione + ripetizioni
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
