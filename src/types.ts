export type SectionType = 'progressione' | 'cedimento' | 'core';

export interface ProgramExercise {
  id: string;
  name: string;
  /** id dell'esercizio in free-exercise-db (es. "Leg_Press") */
  libraryId?: string;
  note?: string;
  warmupNote?: string;
  sectionType: SectionType;
  restTimeSec: number;
  /** prescrizione per settimana, chiave 1..totalWeeks (es. "3X10", "10-9-8..", "4xMAX") */
  weeks: Record<number, string>;
  /** riga (da 1) di questo esercizio nel foglio del coach, se la scheda arriva da lì */
  sheetRow?: number;
  /** 'loads': nel foglio le celle della riga sono vuote e servono a scrivere i carichi; la prescrizione sta nell'intestazione di sezione */
  cellMode?: 'loads';
}

export interface ProgramDay {
  id: string;
  title: string;
  subtitle?: string;
  exercises: ProgramExercise[];
}

export interface ProgramGuidelines {
  modalitaEsecuzione: string[];
  progressione: string;
  cedimento: string;
}

/** Da dove arriva la scheda e come scriverci sopra */
export interface ProgramSource {
  /** nome della scheda (tab) nel foglio Google */
  tab: string;
  /** colonna (da 0) di ogni settimana */
  weekCols: Record<number, number>;
  /** scheda delle misure nel foglio del coach (di solito "MISURE") */
  measuresTab?: string;
  /** scrive i carichi nelle celle della settimana, accanto alla prescrizione */
  annotate: boolean;
}

export interface WorkoutProgram {
  title: string;
  athlete: string;
  trainer: string;
  totalWeeks: number;
  days: ProgramDay[];
  guidelines: ProgramGuidelines;
  source?: ProgramSource;
  /** data (AAAA-MM-GG) del primo giorno della settimana 1: serve ad associare date e settimane */
  startDate?: string;
  updatedAt?: string;
}

export interface SetEntry {
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  weightKg: number;
  reps: number;
}

export interface WorkoutSession {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  startedAt: number;
  endedAt: number;
  dayId: string;
  dayTitle: string;
  weekNumber: number;
  durationMinutes: number;
  totalVolumeKg: number;
  sets: SetEntry[];
  avgBpm?: number;
  maxBpm?: number;
  sheetsSynced?: boolean;
  /** false = da inviare a Fitbit; true = inviato */
  fitbitSynced?: boolean;
  fitbitLogId?: number;
}

export interface Measurement {
  id: string;
  date: string;
  /** settimana del programma (1..n): è la colonna del foglio del coach */
  week?: number;
  weightKg?: number;
  bodyFat?: number;
  chestCm?: number;
  waistCm?: number;
  abdomenCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  notes?: string;
  sheetsSynced?: boolean;
  /** false = da inviare alla fonte dati salute scelta */
  healthSynced?: boolean;
  /** da dove arriva: Foglio, Fitbit, Health Connect (vuoto = inserita nell'app) */
  source?: string;
}

/** Stato di una serie durante l'allenamento */
export interface SetLog {
  weightKg: number;
  reps: number;
  completed: boolean;
}
