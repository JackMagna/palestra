export interface WorkoutWeekTarget {
  week: number;
  label: string; // es. "3X10", "4X10", "3X8 AUMENTO PESO", "10-9-8.."
  targetSets: number;
  targetReps: string; // "10", "8", "6", "10-9-8..", "MAX"
  isWeightIncreaseRecommended?: boolean;
}

export interface ProgramExercise {
  id: string;
  name: string;
  dbKey: string;
  note?: string;
  weeks: Record<number, string>; // week 1 to 6
  sectionType: 'progressione' | 'cedimento' | 'core';
  restTimeSec: number;
  warmupNote: string;
}

export interface ProgramDay {
  id: string;
  title: string;
  subtitle: string;
  exercises: ProgramExercise[];
}

export interface WorkoutProgram {
  title: string;
  athlete: string;
  trainer: string;
  totalWeeks: number;
  days: ProgramDay[];
  guidelines: {
    modalitaEsecuzione: string[];
    progressione: string;
    cedimento: string;
  };
}

export const INITIAL_GYM_PROGRAM: WorkoutProgram = {
  title: 'PROGRAMMA PALESTRA',
  athlete: 'GIACOMO',
  trainer: 'DARIO PERSONAL TRAINER',
  totalWeeks: 6,
  days: [
    {
      id: 'giorno-1',
      title: 'GIORNO 1',
      subtitle: 'Upper Push & Pull + Delts + Core',
      exercises: [
        {
          id: 'ex-1-1',
          name: 'CHEST PRESS PRESA SOPRA',
          dbKey: 'chest-press-sopra',
          note: 'Presa orizzontale prona, petto alto',
          sectionType: 'progressione',
          restTimeSec: 120,
          warmupNote: 'fare 2 serie di avvicinamento carico',
          weeks: {
            1: '3X10',
            2: '4X10',
            3: '3X8 AUMENTO PESO',
            4: '4X8',
            5: '3X6 AUMENTO PESO',
            6: '4X6'
          }
        },
        {
          id: 'ex-1-2',
          name: 'REMATORE AL PULLEY TRIANGOLO',
          dbKey: 'rematore-pulley-triangolo',
          note: 'adduzione scapolare',
          sectionType: 'progressione',
          restTimeSec: 120,
          warmupNote: 'fare 2 serie di avvicinamento carico',
          weeks: {
            1: '3X10',
            2: '4X10',
            3: '3X8 AUMENTO PESO',
            4: '4X8',
            5: '3X6 AUMENTO PESO',
            6: '4X6'
          }
        },
        {
          id: 'ex-1-3',
          name: 'CROCI AI CAVI ALTI',
          dbKey: 'croci-cavi-alti',
          note: 'cedimento tecnico, gomiti bloccati',
          sectionType: 'cedimento',
          restTimeSec: 120,
          warmupNote: 'fare 1 serie di avvicinamento carico',
          weeks: {
            1: '10-9-8..',
            2: '10-9-8..',
            3: '10-9-8..',
            4: '10-9-8..',
            5: '10-9-8..',
            6: '10-9-8..'
          }
        },
        {
          id: 'ex-1-4',
          name: 'TRAZIONI AL PULL DOWN MACHINE',
          dbKey: 'pull-down-machine',
          note: 'focus dorsali',
          sectionType: 'cedimento',
          restTimeSec: 120,
          warmupNote: 'fare 1 serie di avvicinamento carico',
          weeks: {
            1: '10-9-8..',
            2: '10-9-8..',
            3: '10-9-8..',
            4: '10-9-8..',
            5: '10-9-8..',
            6: '10-9-8..'
          }
        },
        {
          id: 'ex-1-5',
          name: 'LENTO MANUBRI PANCA 70',
          dbKey: 'lento-manubri-70',
          note: 'panca inclinata a 70 gradi, no compensi',
          sectionType: 'progressione',
          restTimeSec: 120,
          warmupNote: 'fare 1 serie di avvicinamento carico',
          weeks: {
            1: '3X10',
            2: '4X10',
            3: '3X8 AUMENTO PESO',
            4: '4X8',
            5: '3X6 AUMENTO PESO',
            6: '4X6'
          }
        },
        {
          id: 'ex-1-6',
          name: 'ALZATE LATERALI PRONO PANCA 60',
          dbKey: 'alzate-laterali-prono-60',
          note: 'petto aderente alla panca a 60 gradi',
          sectionType: 'cedimento',
          restTimeSec: 120,
          warmupNote: 'fare 1 serie di avvicinamento carico',
          weeks: {
            1: '10-9-8..',
            2: '10-9-8..',
            3: '10-9-8..',
            4: '10-9-8..',
            5: '10-9-8..',
            6: '10-9-8..'
          }
        },
        {
          id: 'ex-1-7',
          name: 'REVERS CRUNCH DECLINATA',
          dbKey: 'reverse-crunch-declinata',
          note: 'arrotola il bacino al torace',
          sectionType: 'core',
          restTimeSec: 90,
          warmupNote: 'nessun avvicinamento necessario',
          weeks: {
            1: '4xMAX',
            2: '4xMAX',
            3: '4xMAX',
            4: '4xMAX',
            5: '4xMAX',
            6: '4xMAX'
          }
        }
      ]
    },
    {
      id: 'giorno-2',
      title: 'GIORNO 2',
      subtitle: 'Legs & Arms & Posterior Chain',
      exercises: [
        {
          id: 'ex-2-1',
          name: 'PRESSA 45',
          dbKey: 'pressa-45',
          note: 'pressione costante sui talloni, no stacco lombare',
          sectionType: 'progressione',
          restTimeSec: 120,
          warmupNote: 'fare 2 serie di avvicinamento carico',
          weeks: {
            1: '3X10',
            2: '4X10',
            3: '3X8 AUMENTO PESO',
            4: '4X8',
            5: '3X6 AUMENTO PESO',
            6: '4X6'
          }
        },
        {
          id: 'ex-2-2',
          name: 'LEG CURL SEDUTO',
          dbKey: 'leg-curl-seduto',
          note: 'blocco cosce saldo, perno al ginocchio',
          sectionType: 'progressione',
          restTimeSec: 120,
          warmupNote: 'fare 2 serie di avvicinamento carico',
          weeks: {
            1: '3X10',
            2: '4X10',
            3: '3X8 AUMENTO PESO',
            4: '4X8',
            5: '3X6 AUMENTO PESO',
            6: '4X6'
          }
        },
        {
          id: 'ex-2-3',
          name: 'CURL BILANCIERE',
          dbKey: 'curl-bilanciere',
          note: 'gomiti bloccati ai fianchi, no oscillazioni',
          sectionType: 'progressione',
          restTimeSec: 120,
          warmupNote: 'fare 2 serie di avvicinamento carico',
          weeks: {
            1: '3X10',
            2: '4X10',
            3: '3X8 AUMENTO PESO',
            4: '4X8',
            5: '3X6 AUMENTO PESO',
            6: '4X6'
          }
        },
        {
          id: 'ex-2-4',
          name: 'PUSH DOWN SBARRA',
          dbKey: 'push-down-sbarra',
          note: 'estensione completa gomiti verso il basso',
          sectionType: 'progressione',
          restTimeSec: 120,
          warmupNote: 'fare 2 serie di avvicinamento carico',
          weeks: {
            1: '3X10',
            2: '4X10',
            3: '3X8 AUMENTO PESO',
            4: '4X8',
            5: '3X6 AUMENTO PESO',
            6: '4X6'
          }
        },
        {
          id: 'ex-2-5',
          name: 'CURL MANUBRI PANCA 45',
          dbKey: 'curl-manubri-panca-45',
          note: 'massimo allungamento bicipite in partenza',
          sectionType: 'cedimento',
          restTimeSec: 120,
          warmupNote: 'fare 1 serie di avvicinamento carico',
          weeks: {
            1: '10-9-8..',
            2: '10-9-8..',
            3: '10-9-8..',
            4: '10-9-8..',
            5: '10-9-8..',
            6: '10-9-8..'
          }
        },
        {
          id: 'ex-2-6',
          name: 'FRENCH PRESS MANUBRI PIANA',
          dbKey: 'french-press-manubri-piana',
          note: 'gomiti inclinati indietro di 10-15 gradi',
          sectionType: 'cedimento',
          restTimeSec: 120,
          warmupNote: 'fare 1 serie di avvicinamento carico',
          weeks: {
            1: '10-9-8..',
            2: '10-9-8..',
            3: '10-9-8..',
            4: '10-9-8..',
            5: '10-9-8..',
            6: '10-9-8..'
          }
        },
        {
          id: 'ex-2-7',
          name: 'HIPEREXTENSION',
          dbKey: 'hiperextension',
          note: 'contrazione lombare e glutei senza iperestendere',
          sectionType: 'core',
          restTimeSec: 90,
          warmupNote: 'nessun avvicinamento necessario',
          weeks: {
            1: '4xMAX',
            2: '4xMAX',
            3: '4xMAX',
            4: '4xMAX',
            5: '4xMAX',
            6: '4xMAX'
          }
        }
      ]
    }
  ],
  guidelines: {
    modalitaEsecuzione: [
      'fare 3 allenamenti a settimana alternando i due giorni',
      'fare movimenti controllati con discesa lenta di 2-3 secondi'
    ],
    progressione: 'utilizzare un carico e aumentarlo ogni due settimane abbassando le rep',
    cedimento: 'portare tutte le serie a cedimento tecnico e se si superano aumentare il carico'
  }
};
