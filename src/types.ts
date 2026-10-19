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
  weightKg: number;
  bodyFat?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  thighsCm?: number;
  notes?: string;
  sheetsSynced?: boolean;
  /** es. "Fitbit" quando la pesata arriva da lì */
  source?: string;
}

/** Stato di una serie durante l'allenamento */
export interface SetLog {
  weightKg: number;
  reps: number;
  completed: boolean;
}
