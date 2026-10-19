import React, { useState, useMemo } from 'react';
import { Search, Dumbbell, Play, Youtube, Info, Sparkles, Filter, ExternalLink } from 'lucide-react';
import { EXERCISE_DATABASE, ExerciseDBItem } from '../data/exerciseDb';
import { ExerciseModal } from './ExerciseModal';

export const ExerciseCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('Tutti');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDBItem | null>(null);

  const bodyParts = ['Tutti', 'Petto', 'Dorso', 'Spalle', 'Bicipiti', 'Tricipiti', 'Gambe', 'Addome', 'Lombari'];

  const exerciseList = useMemo(() => {
    return Object.values(EXERCISE_DATABASE);
  }, []);

  const filteredExercises = useMemo(() => {
    return exerciseList.filter((item) => {
      const matchesSearch = 
        item.italianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetMuscle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipment.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPart = selectedBodyPart === 'Tutti' || item.bodyPart === selectedBodyPart;

      return matchesSearch && matchesPart;
    });
  }, [exerciseList, searchTerm, selectedBodyPart]);

  return (
    <div className="space-y-6 pb-28">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Libreria Video ExerciseDB</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Guida & Video Esecuzioni Corrette
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Istruzioni biomeccaniche e video dimostrativi per ogni esercizio della scheda. Scopri come attivare i muscoli target ed evitare compensi scorretti.
            </p>
          </div>

          <a
            href="https://github.com/ExerciseDB/exercisedb-api"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <span>Standard ExerciseDB</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cerca esercizio (es. Chest Press, Pulley, Dorsali, Manubri)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Muscle Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {bodyParts.map((part) => (
            <button
              key={part}
              onClick={() => setSelectedBodyPart(part)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBodyPart === part
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {part}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExercises.map((ex) => (
          <div
            key={ex.id}
            onClick={() => setSelectedExercise(ex)}
            className="group rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl"
          >
            <div>
              {/* Header tags */}
              <div className="flex items-center justify-between gap-2 text-xs mb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase text-[10px]">
                  {ex.bodyPart}
                </span>
                <span className="text-slate-400 text-[11px] truncate">
                  {ex.equipment}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                {ex.italianName}
              </h3>
              <p className="text-xs text-slate-400 italic mt-0.5">
                {ex.name}
              </p>

              {/* Target muscle */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px] block">Target:</span>
                <span className="font-semibold text-slate-200">{ex.targetMuscle}</span>
              </div>

              {/* Coach cue */}
              {ex.trainerCues[0] && (
                <p className="text-[11px] text-amber-300/80 mt-2 line-clamp-2">
                  💡 {ex.trainerCues[0]}
                </p>
              )}
            </div>

            {/* Bottom action trigger */}
            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-medium text-amber-400 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                <span>3D Macchina & Muscle Visualizer</span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 flex items-center justify-center transition-all">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <ExerciseModal
        isOpen={!!selectedExercise}
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
};
