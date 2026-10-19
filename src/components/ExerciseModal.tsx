import React from 'react';
import { X, Youtube, Info, CheckCircle2, AlertTriangle, Target, Dumbbell, Play } from 'lucide-react';
import { ExerciseDBItem } from '../data/exerciseDb';
import { ExerciseMotionClip } from './ExerciseMotionClip';

interface ExerciseModalProps {
  exercise: ExerciseDBItem | null;
  isOpen: boolean;
  onClose: () => void;
  customNote?: string;
  targetWeekNote?: string;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  exercise,
  isOpen,
  onClose,
  customNote,
  targetWeekNote
}) => {
  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
              {exercise.bodyPart} · {exercise.equipment}
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {exercise.italianName}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi finestra"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Target for this week */}
          {targetWeekNote && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Target className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-amber-300">Target Prescritto nella Scheda</p>
                <p className="text-sm font-bold text-white mt-0.5">{targetWeekNote}</p>
                {customNote && <p className="text-xs text-slate-300 mt-1 italic">Note: "{customNote}"</p>}
              </div>
            </div>
          )}

          {/* In-App Biomechanical Motion Clip & Muscle Visualizer (ExerciseDB) */}
          <div className="space-y-2">
            <ExerciseMotionClip
              exercise={exercise}
              exerciseIndex={0}
              totalExercises={1}
            />
          </div>

          {/* Dario PT Coaching Cues */}
          {exercise.trainerCues.length > 0 && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Info className="w-4 h-4" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Note del Personal Trainer Dario</h4>
              </div>
              <ul className="space-y-2">
                {exercise.trainerCues.map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Muscle Anatomy Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 mb-1.5">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                Muscolo Principale
              </div>
              <p className="text-sm font-bold text-white">{exercise.targetMuscle}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 mb-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                Muscoli Sinergici
              </div>
              <p className="text-xs text-slate-300 font-medium">{exercise.secondaryMuscles.join(', ')}</p>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Istruzioni Passo-Passo (Standard ExerciseDB)
            </h4>
            <div className="space-y-2">
              {exercise.instructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Warmup Notice */}
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Ricorda: esegui sempre le serie di avvicinamento al carico prescritte prima di caricare il peso target, e arresta la serie in caso di perdita del cedimento tecnico.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Ho capito, torna all'allenamento
          </button>
        </div>
      </div>
    </div>
  );
};
