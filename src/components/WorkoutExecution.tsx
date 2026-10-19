import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Plus, 
  Minus, 
  Timer, 
  Save, 
  Flame, 
  Dumbbell, 
  ChevronLeft, 
  ChevronRight, 
  Watch, 
  Heart, 
  Info, 
  CheckCircle2, 
  Target,
  Sparkles,
  RotateCcw,
  Activity
} from 'lucide-react';
import { ProgramDay, ProgramExercise, WorkoutProgram } from '../data/initialProgram';
import { EXERCISE_DATABASE, ExerciseDBItem } from '../data/exerciseDb';
import { ExerciseMotionClip } from './ExerciseMotionClip';
import { MuscleVisualizer } from './MuscleVisualizer';
import { RestTimer } from './RestTimer';
import { SmartwatchModal } from './SmartwatchModal';
import { sound } from '../utils/sound';

export interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

interface WorkoutExecutionProps {
  program: WorkoutProgram;
  activeDayId: string;
  onSelectDay: (dayId: string) => void;
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  onSaveSession: (sessionSummary: {
    dayId: string;
    dayTitle: string;
    weekNumber: number;
    durationMinutes: number;
    totalVolumeKg: number;
    completedSets: {
      exerciseName: string;
      setIndex: number;
      weightKg: number;
      reps: number;
    }[];
  }) => Promise<void>;
  isSaving?: boolean;
}

export const WorkoutExecution: React.FC<WorkoutExecutionProps> = ({
  program,
  activeDayId,
  onSelectDay,
  currentWeek,
  onSelectWeek,
  onSaveSession,
  isSaving = false
}) => {
  const currentDay = program.days.find(d => d.id === activeDayId) || program.days[0];
  
  // Horizontal Exercise Navigation: Active exercise index (0 to total-1)
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // Active set index within the current exercise
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Muscle visualizer toggle
  const [showMuscleMap, setShowMuscleMap] = useState(false);

  // Exercise session tracking state: Record<exerciseId, SetLog[]>
  const [exerciseStates, setExerciseStates] = useState<Record<string, SetLog[]>>({});

  // Rest Timer state
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);

  // Smartwatch integration modal & live metrics
  const [isSmartwatchOpen, setIsSmartwatchOpen] = useState(false);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [liveCalories, setLiveCalories] = useState<number>(0);

  // Workout duration timer
  const [sessionStartTime] = useState<number>(Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Initialize sets for current day based on week target prescription
  useEffect(() => {
    const initial: Record<string, SetLog[]> = {};

    currentDay.exercises.forEach((ex) => {
      const weekTarget = ex.weeks[currentWeek] || '3X10';
      let setsCount = 3;
      let defaultReps = 10;

      if (weekTarget.includes('4X10')) {
        setsCount = 4;
        defaultReps = 10;
      } else if (weekTarget.includes('4X8')) {
        setsCount = 4;
        defaultReps = 8;
      } else if (weekTarget.includes('3X8')) {
        setsCount = 3;
        defaultReps = 8;
      } else if (weekTarget.includes('4X6')) {
        setsCount = 4;
        defaultReps = 6;
      } else if (weekTarget.includes('3X6')) {
        setsCount = 3;
        defaultReps = 6;
      } else if (weekTarget.includes('4xMAX') || weekTarget.includes('4XMAX')) {
        setsCount = 4;
        defaultReps = 15;
      } else if (weekTarget.includes('10-9-8..')) {
        setsCount = 3;
        defaultReps = 10;
      }

      initial[ex.id] = Array.from({ length: setsCount }, (_, i) => ({
        setNumber: i + 1,
        weightKg: 20,
        reps: defaultReps - (weekTarget.includes('10-9-8..') ? i : 0),
        completed: false
      }));
    });

    setExerciseStates(initial);
    setActiveExerciseIndex(0);
    setActiveSetIndex(0);
  }, [currentDay.id, currentWeek]);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - sessionStartTime) / 60000));
    }, 15000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const currentExercise = currentDay.exercises[activeExerciseIndex] || currentDay.exercises[0];
  const dbItem: ExerciseDBItem = EXERCISE_DATABASE[currentExercise?.dbKey] || {
    id: currentExercise?.dbKey || 'unknown',
    name: currentExercise?.name || '',
    italianName: currentExercise?.name || '',
    bodyPart: 'Petto',
    targetMuscle: 'Fibre Muscolari Principali',
    secondaryMuscles: [],
    equipment: 'Attrezzatura Palestra',
    trainerCues: [],
    instructions: [],
    videoTutorialUrl: '',
    gifPlaceholderSvg: ''
  };

  const currentSets = exerciseStates[currentExercise?.id] || [];
  const currentSet = currentSets[activeSetIndex] || currentSets[0] || {
    setNumber: 1,
    weightKg: 20,
    reps: 10,
    completed: false
  };

  const currentWeekPrescription = currentExercise?.weeks[currentWeek] || '3X10';

  // Navigate to previous/next exercise
  const goToPreviousExercise = () => {
    if (activeExerciseIndex > 0) {
      setActiveExerciseIndex(prev => prev - 1);
      setActiveSetIndex(0);
    }
  };

  const goToNextExercise = () => {
    if (activeExerciseIndex < currentDay.exercises.length - 1) {
      setActiveExerciseIndex(prev => prev + 1);
      setActiveSetIndex(0);
    }
  };

  // Adjust weight for the active set
  const adjustActiveSetWeight = (delta: number) => {
    setExerciseStates(prev => {
      const sets = [...(prev[currentExercise.id] || [])];
      if (!sets[activeSetIndex]) return prev;

      const newWeight = Math.max(0, Number((sets[activeSetIndex].weightKg + delta).toFixed(1)));
      sets[activeSetIndex] = { ...sets[activeSetIndex], weightKg: newWeight };

      // Propagate forward to next uncompleted sets
      for (let j = activeSetIndex + 1; j < sets.length; j++) {
        if (!sets[j].completed) {
          sets[j] = { ...sets[j], weightKg: newWeight };
        }
      }

      return { ...prev, [currentExercise.id]: sets };
    });
  };

  // Adjust reps for the active set
  const adjustActiveSetReps = (delta: number) => {
    setExerciseStates(prev => {
      const sets = [...(prev[currentExercise.id] || [])];
      if (!sets[activeSetIndex]) return prev;

      const newReps = Math.max(1, sets[activeSetIndex].reps + delta);
      sets[activeSetIndex] = { ...sets[activeSetIndex], reps: newReps };

      return { ...prev, [currentExercise.id]: sets };
    });
  };

  // Complete current set
  const handleCompleteCurrentSet = () => {
    setExerciseStates(prev => {
      const sets = [...(prev[currentExercise.id] || [])];
      if (!sets[activeSetIndex]) return prev;

      sets[activeSetIndex] = { ...sets[activeSetIndex], completed: true };
      return { ...prev, [currentExercise.id]: sets };
    });

    sound.playSetDone();

    // Trigger Rest Timer automatically
    setTimerSeconds(currentExercise.restTimeSec || 120);
    setIsTimerOpen(true);

    // Auto-advance to next set if available, otherwise suggest next exercise
    if (activeSetIndex < currentSets.length - 1) {
      setActiveSetIndex(prev => prev + 1);
    } else if (activeExerciseIndex < currentDay.exercises.length - 1) {
      // All sets done for this exercise, prompt to move forward
      setTimeout(() => {
        goToNextExercise();
      }, 600);
    }
  };

  // Calculate volume & completed sets summary
  let totalVolumeKg = 0;
  let totalCompletedSetsCount = 0;
  let totalRequiredSetsCount = 0;

  Object.values(exerciseStates).forEach(sets => {
    sets.forEach(s => {
      totalRequiredSetsCount++;
      if (s.completed) {
        totalCompletedSetsCount++;
        totalVolumeKg += s.weightKg * s.reps;
      }
    });
  });

  const completionPercent = totalRequiredSetsCount > 0 
    ? Math.round((totalCompletedSetsCount / totalRequiredSetsCount) * 100) 
    : 0;

  const handleFinishWorkout = async () => {
    const completedList: { exerciseName: string; setIndex: number; weightKg: number; reps: number }[] = [];
    currentDay.exercises.forEach(ex => {
      const sets = exerciseStates[ex.id] || [];
      sets.forEach((s, idx) => {
        if (s.completed) {
          completedList.push({
            exerciseName: ex.name,
            setIndex: idx,
            weightKg: s.weightKg,
            reps: s.reps
          });
        }
      });
    });

    await onSaveSession({
      dayId: currentDay.id,
      dayTitle: currentDay.title,
      weekNumber: currentWeek,
      durationMinutes: Math.max(1, elapsedMinutes),
      totalVolumeKg,
      completedSets: completedList
    });
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Mobile Bar: Day, Week & Smartwatch Status */}
      <div className="flex items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5">
          {program.days.map(d => (
            <button
              key={d.id}
              onClick={() => onSelectDay(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                d.id === currentDay.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>

        {/* Week Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 px-1 font-bold">SETT.</span>
          {[1, 2, 3, 4, 5, 6].map(w => (
            <button
              key={w}
              onClick={() => onSelectWeek(w)}
              className={`w-6 h-6 rounded-lg text-xs font-mono font-bold transition-all ${
                w === currentWeek
                  ? 'bg-white text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Smartwatch / Heart Rate button */}
        <button
          onClick={() => setIsSmartwatchOpen(true)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all ${
            liveBpm 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Collega orologio o sensore cardio"
        >
          <Watch className="w-3.5 h-3.5" />
          <span>{liveBpm ? `${liveBpm} BPM` : 'Orologio'}</span>
        </button>
      </div>

      {/* Horizontal Exercise Scroller Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {currentDay.exercises.map((ex, idx) => {
          const sets = exerciseStates[ex.id] || [];
          const isDone = sets.length > 0 && sets.every(s => s.completed);
          const isActive = idx === activeExerciseIndex;

          return (
            <button
              key={ex.id}
              onClick={() => {
                setActiveExerciseIndex(idx);
                setActiveSetIndex(0);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-102'
                  : isDone
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {isDone ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <span className="font-mono">{idx + 1}.</span>
              )}
              <span className="truncate max-w-[130px]">{ex.name}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN SINGLE-EXERCISE MOBILE-FOCUSED CARD */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden space-y-4">
        {/* IN-APP MINI-CLIP VIDEO AT THE TOP */}
        <ExerciseMotionClip
          exercise={dbItem}
          exerciseIndex={activeExerciseIndex}
          totalExercises={currentDay.exercises.length}
        />

        {/* Exercise Info & Dario PT Cue */}
        <div className="px-5 pt-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {currentExercise.sectionType.toUpperCase()} · {currentWeekPrescription}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Rip. {currentExercise.restTimeSec / 60} minuti
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
            {currentExercise.name}
          </h2>

          {/* Dario PT Technical Cue Box */}
          {currentExercise.note && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400 uppercase tracking-wide text-[10px] block">Nota Coach Dario:</strong>
                <span>"{currentExercise.note}"</span>
              </div>
            </div>
          )}

          {currentExercise.warmupNote && (
            <p className="text-[11px] text-slate-400">
              {currentExercise.warmupNote}
            </p>
          )}

          {/* Muscle Visualizer Map Trigger & Heatmap */}
          <div className="pt-2">
            <button
              onClick={() => setShowMuscleMap(!showMuscleMap)}
              className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between transition-all group shadow-sm active:scale-99"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">
                    {showMuscleMap ? 'Nascondi Mappa Muscolare' : 'Mappa Anatomica Interattiva (Muscle Visualizer)'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    Focus: {dbItem.targetMuscle}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 group-hover:text-white border border-slate-700">
                {showMuscleMap ? 'Chiudi' : 'Apri'}
              </span>
            </button>
            {showMuscleMap && (
              <div className="mt-3 animate-in fade-in duration-200">
                <MuscleVisualizer exercise={dbItem} />
              </div>
            )}
          </div>
        </div>

        {/* SET SELECTOR PILLS */}
        <div className="px-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {currentSets.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSetIndex(idx)}
                className={`flex-1 min-w-[75px] py-2.5 rounded-2xl text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${
                  idx === activeSetIndex
                    ? 'bg-white text-slate-950 shadow-md ring-2 ring-amber-400'
                    : s.completed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                <span>SERIE {s.setNumber}</span>
                <span className="text-[10px] font-normal opacity-90">
                  {s.completed ? '✓ Fatta' : `${s.weightKg}kg · ${s.reps}r`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* GIANT CONTROLS FOR ACTIVE SET (Touch-friendly for Gym) */}
        <div className="px-5 space-y-4">
          {/* Weight Control */}
          <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
              Carico Serie {activeSetIndex + 1}
            </span>

            {/* Giant Weight Number */}
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-5xl font-black font-mono text-white tracking-tight tabular-nums">
                {currentSet.weightKg}
              </span>
              <span className="text-base font-bold text-amber-400">KG</span>
            </div>

            {/* Large Quick Step Buttons */}
            <div className="flex items-center gap-2 mt-2 w-full justify-center">
              <button
                onClick={() => adjustActiveSetWeight(-5)}
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center active:scale-90 transition-all border border-slate-700"
              >
                -5
              </button>
              <button
                onClick={() => adjustActiveSetWeight(-2.5)}
                className="w-13 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center active:scale-90 transition-all border border-slate-700"
              >
                -2.5
              </button>
              <button
                onClick={() => adjustActiveSetWeight(-1)}
                className="w-11 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center active:scale-90 transition-all border border-slate-700"
              >
                -1
              </button>
              <button
                onClick={() => adjustActiveSetWeight(1)}
                className="w-11 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center active:scale-90 transition-all border border-slate-700"
              >
                +1
              </button>
              <button
                onClick={() => adjustActiveSetWeight(2.5)}
                className="w-13 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center active:scale-90 transition-all border border-slate-700"
              >
                +2.5
              </button>
              <button
                onClick={() => adjustActiveSetWeight(5)}
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center active:scale-90 transition-all border border-slate-700"
              >
                +5
              </button>
            </div>
          </div>

          {/* Reps Control */}
          <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                Ripetizioni
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black font-mono text-white tracking-tight tabular-nums">
                  {currentSet.reps}
                </span>
                <span className="text-xs font-bold text-slate-400">REPS</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustActiveSetReps(-1)}
                className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-90 transition-all text-xl border border-slate-700"
                aria-label="Meno ripetizioni"
              >
                <Minus className="w-6 h-6" />
              </button>
              <button
                onClick={() => adjustActiveSetReps(1)}
                className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-90 transition-all text-xl border border-slate-700"
                aria-label="Più ripetizioni"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* GIANT "COMPLETA SERIE" BUTTON */}
          <button
            onClick={handleCompleteCurrentSet}
            className={`w-full h-15 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-xl transition-all active:scale-98 ${
              currentSet.completed
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-300'
            }`}
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>
              {currentSet.completed ? 'SERIE COMPLETATA (RIPETI)' : `COMPLETA SERIE ${activeSetIndex + 1}`}
            </span>
          </button>
        </div>

        {/* BOTTOM HORIZONTAL EXERCISE NAVIGATION (PREV / NEXT) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={goToPreviousExercise}
            disabled={activeExerciseIndex === 0}
            className={`flex-1 h-12 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeExerciseIndex === 0
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-850'
                : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Prec.</span>
          </button>

          <span className="text-xs font-mono font-bold text-slate-400 px-2 whitespace-nowrap">
            {activeExerciseIndex + 1} di {currentDay.exercises.length}
          </span>

          <button
            onClick={goToNextExercise}
            disabled={activeExerciseIndex === currentDay.exercises.length - 1}
            className={`flex-1 h-12 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeExerciseIndex === currentDay.exercises.length - 1
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-850'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 font-black active:scale-95'
            }`}
          >
            <span>Succ.</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* FINISH WORKOUT SUMMARY BAR */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
            Avanzamento Totale
          </span>
          <span className="text-sm font-bold text-white font-mono">
            {totalCompletedSetsCount} / {totalRequiredSetsCount} serie fatte ({totalVolumeKg.toLocaleString()} kg)
          </span>
        </div>

        <button
          onClick={handleFinishWorkout}
          disabled={isSaving || totalCompletedSetsCount === 0}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
            totalCompletedSetsCount > 0
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Salvataggio...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Concludi Workout</span>
            </>
          )}
        </button>
      </div>

      {/* REST TIMER POPUP */}
      <RestTimer
        isOpen={isTimerOpen}
        initialSeconds={timerSeconds}
        onClose={() => setIsTimerOpen(false)}
        exerciseName={currentExercise.name}
      />

      {/* SMARTWATCH HEALTH MODAL */}
      <SmartwatchModal
        isOpen={isSmartwatchOpen}
        onClose={() => setIsSmartwatchOpen(false)}
        currentDurationMinutes={elapsedMinutes}
        onUpdateBpm={(bpm, cal) => {
          setLiveBpm(bpm);
          setLiveCalories(cal);
        }}
      />
    </div>
  );
};
