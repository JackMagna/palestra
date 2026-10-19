import type { ProgramExercise, WorkoutProgram } from '../types';

const PROGRESSIONE: Record<number, string> = {
  1: '3X10', 2: '4X10', 3: '3X8 AUMENTO PESO', 4: '4X8', 5: '3X6 AUMENTO PESO', 6: '4X6'
};
const CEDIMENTO: Record<number, string> = {
  1: '10-9-8..', 2: '10-9-8..', 3: '10-9-8..', 4: '10-9-8..', 5: '10-9-8..', 6: '10-9-8..'
};
const CORE: Record<number, string> = {
  1: '4xMAX', 2: '4xMAX', 3: '4xMAX', 4: '4xMAX', 5: '4xMAX', 6: '4xMAX'
};

function ex(
  id: string,
  name: string,
  libraryId: string,
  sectionType: ProgramExercise['sectionType'],
  note: string,
  warmupNote: string
): ProgramExercise {
  const weeks = sectionType === 'progressione' ? PROGRESSIONE : sectionType === 'cedimento' ? CEDIMENTO : CORE;
  return {
    id,
    name,
    libraryId,
    sectionType,
    note,
    warmupNote,
    restTimeSec: sectionType === 'core' ? 90 : 120,
    weeks: { ...weeks }
  };
}

/** Scheda di partenza: quella di Giacomo con Dario PT. Si può modificare dall'app. */
export const DEFAULT_PROGRAM: WorkoutProgram = {
  title: 'Programma palestra',
  athlete: 'Giacomo',
  trainer: 'Dario Personal Trainer',
  totalWeeks: 6,
  days: [
    {
      id: 'giorno-1',
      title: 'Giorno 1',
      subtitle: 'Petto, dorso, spalle e addome',
      exercises: [
        ex('ex-1-1', 'Chest press presa sopra', 'Leverage_Chest_Press', 'progressione', 'Presa orizzontale prona, petto alto', '2 serie di avvicinamento'),
        ex('ex-1-2', 'Rematore al pulley triangolo', 'Seated_Cable_Rows', 'progressione', 'Adduzione scapolare', '2 serie di avvicinamento'),
        ex('ex-1-3', 'Croci ai cavi alti', 'Cable_Crossover', 'cedimento', 'Cedimento tecnico, gomiti bloccati', '1 serie di avvicinamento'),
        ex('ex-1-4', 'Trazioni al pull down machine', 'Wide-Grip_Lat_Pulldown', 'cedimento', 'Focus dorsali', '1 serie di avvicinamento'),
        ex('ex-1-5', 'Lento manubri panca 70°', 'Seated_Dumbbell_Press', 'progressione', 'Panca inclinata a 70°, niente compensi', '1 serie di avvicinamento'),
        ex('ex-1-6', 'Alzate laterali prono panca 60°', 'Lying_Rear_Delt_Raise', 'cedimento', 'Petto aderente alla panca a 60°', '1 serie di avvicinamento'),
        ex('ex-1-7', 'Reverse crunch declinata', 'Decline_Reverse_Crunch', 'core', 'Arrotola il bacino verso il torace', '')
      ]
    },
    {
      id: 'giorno-2',
      title: 'Giorno 2',
      subtitle: 'Gambe, braccia e catena posteriore',
      exercises: [
        ex('ex-2-1', 'Pressa 45°', 'Leg_Press', 'progressione', 'Pressione costante sui talloni, lombari sempre appoggiate', '2 serie di avvicinamento'),
        ex('ex-2-2', 'Leg curl seduto', 'Seated_Leg_Curl', 'progressione', 'Cosce bloccate, perno al ginocchio', '2 serie di avvicinamento'),
        ex('ex-2-3', 'Curl bilanciere', 'Barbell_Curl', 'progressione', 'Gomiti fermi ai fianchi, niente oscillazioni', '2 serie di avvicinamento'),
        ex('ex-2-4', 'Push down sbarra', 'Triceps_Pushdown', 'progressione', 'Estensione completa dei gomiti', '2 serie di avvicinamento'),
        ex('ex-2-5', 'Curl manubri panca 45°', 'Incline_Dumbbell_Curl', 'cedimento', 'Massimo allungamento del bicipite in partenza', '1 serie di avvicinamento'),
        ex('ex-2-6', 'French press manubri panca piana', 'Lying_Dumbbell_Tricep_Extension', 'cedimento', 'Gomiti inclinati indietro di 10-15°', '1 serie di avvicinamento'),
        ex('ex-2-7', 'Hyperextension', 'Hyperextensions_Back_Extensions', 'core', 'Contrai lombari e glutei senza iperestendere', '')
      ]
    }
  ],
  guidelines: {
    modalitaEsecuzione: [
      'Fare 3 allenamenti a settimana alternando i due giorni',
      'Movimenti controllati con discesa lenta di 2-3 secondi'
    ],
    progressione: 'Usa un carico e aumentalo ogni due settimane abbassando le ripetizioni',
    cedimento: 'Porta tutte le serie a cedimento tecnico; se superi le ripetizioni, aumenta il carico'
  }
};

export const SECTION_LABELS: Record<ProgramExercise['sectionType'], string> = {
  progressione: 'Progressione',
  cedimento: 'Cedimento',
  core: 'Core'
};
