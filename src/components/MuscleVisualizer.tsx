import React, { useState } from 'react';
import { Target, Activity, ShieldCheck, Info, Sparkles, Layers, Eye } from 'lucide-react';
import { ExerciseDBItem } from '../data/exerciseDb';

interface MuscleVisualizerProps {
  exercise: ExerciseDBItem;
  size?: 'compact' | 'full';
  defaultView?: 'both' | 'front' | 'back';
}

interface MuscleInfo {
  id: string;
  name: string;
  latinName: string;
  role: 'primary' | 'synergist' | 'stabilizer';
  activationPercent: number;
  description: string;
}

export const MuscleVisualizer: React.FC<MuscleVisualizerProps> = ({
  exercise,
  size = 'compact',
  defaultView = 'both'
}) => {
  const [viewAngle, setViewAngle] = useState<'both' | 'front' | 'back'>(defaultView);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleInfo | null>(null);

  // Biomechanical muscle mapping based on exercise ID and target
  const target = exercise.bodyPart;
  const exId = exercise.id;

  const isChestPress = exId.includes('chest');
  const isPulleyRow = exId.includes('pulley') || exId.includes('row');
  const isCableFly = exId.includes('croci') || exId.includes('fly');
  const isLatPull = exId.includes('pull-down');
  const isLento70 = exId.includes('lento');
  const isAlzate60 = exId.includes('alzate');
  const isLegPress = exId.includes('pressa');
  const isLegCurl = exId.includes('leg-curl');
  const isBicepCurl = exId.includes('curl-bilanciere') || exId.includes('curl-manubri');
  const isTricep = exId.includes('push-down') || exId.includes('french');
  const isCore = exId.includes('crunch') || exId.includes('hiper');

  // Primary activation flags
  const isPecs = target === 'Petto' || isChestPress || isCableFly;
  const isBack = target === 'Dorso' || isPulleyRow || isLatPull;
  const isDelts = target === 'Spalle' || isLento70;
  const isRearDelts = isAlzate60 || (target === 'Spalle' && exId.includes('alzate')) || isPulleyRow;
  const isBiceps = target === 'Bicipiti' || isBicepCurl;
  const isTriceps = target === 'Tricipiti' || isTricep;
  const isQuads = target === 'Gambe' && isLegPress;
  const isHamstrings = target === 'Gambe' && (isLegCurl || exId.includes('hiperextension'));
  const isAbs = target === 'Addome' || exId.includes('crunch');
  const isLowerBack = target === 'Lombari' || exId.includes('hiper');

  // Primary active muscle data
  const primaryMuscleName = isPecs ? 'Grande Pettorale'
    : isBack ? 'Gran Dorsale & Romboidi'
    : isDelts ? 'Deltoide Anteriore & Laterale'
    : isRearDelts ? 'Deltoide Posteriore'
    : isBiceps ? 'Bicipite Brachiale'
    : isTriceps ? 'Tricipite Brachiale'
    : isQuads ? 'Quadricipite Femorale'
    : isHamstrings ? 'Bicipite Femorale (Ischiocrurali)'
    : isAbs ? 'Retto dell\'Addome'
    : 'Erettori Spinali & Lombari';

  const primaryLatinName = isPecs ? 'Pectoralis Major'
    : isBack ? 'Latissimus Dorsi'
    : isDelts ? 'Deltoideus Anterior/Lateralis'
    : isRearDelts ? 'Deltoideus Posterior'
    : isBiceps ? 'Biceps Brachii'
    : isTriceps ? 'Triceps Brachii'
    : isQuads ? 'Quadriceps Femoris'
    : isHamstrings ? 'Biceps Femoris'
    : isAbs ? 'Rectus Abdominis'
    : 'Erector Spinae';

  return (
    <div className="rounded-3xl bg-slate-950 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-2xl">
      {/* Header bar matching ExerciseDB/muscle-visualizer-api */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Muscle Visualizer API
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                ExerciseDB Biomechanic
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Mappa termica di attivazione e isolamento neuromuscolare
            </p>
          </div>
        </div>

        {/* View Angle Selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewAngle('both')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              viewAngle === 'both' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fronte + Retro
          </button>
          <button
            onClick={() => setViewAngle('front')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              viewAngle === 'front' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fronte
          </button>
          <button
            onClick={() => setViewAngle('back')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              viewAngle === 'back' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Retro
          </button>
        </div>
      </div>

      {/* Anatomical Maps Display Canvas */}
      <div className={`grid gap-4 items-center justify-center p-3 sm:p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 ${
        viewAngle === 'both' ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'
      }`}>
        {/* --- FRONT ANATOMICAL SILHOUETTE --- */}
        {(viewAngle === 'both' || viewAngle === 'front') && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono font-bold text-amber-400/90 mb-2 tracking-wider flex items-center gap-1">
              <span>●</span> VISTA ANTERIORE (FRONT)
            </span>
            <svg 
              viewBox="0 0 100 170" 
              className="w-32 h-48 sm:w-36 sm:h-56 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] cursor-pointer select-none"
            >
              <defs>
                <radialGradient id="targetRedPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="60%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#991B1B" />
                </radialGradient>
                <radialGradient id="synergistGreen" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </radialGradient>
                <radialGradient id="stabilizerCyan" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </radialGradient>
                <filter id="muscleGlow">
                  <feGaussianBlur stdDeviation="1.8" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Head & Cranium */}
              <circle cx="50" cy="16" r="9" fill="#1E293B" stroke="#334155" strokeWidth="1" />
              {/* Neck & Sternocleidomastoid */}
              <path d="M 46 25 L 54 25 L 56 31 L 44 31 Z" fill="#334155" />

              {/* Trapezius Superior (Front collarbone line) */}
              <path d="M 38 31 L 62 31 L 56 35 L 44 35 Z" fill="#334155" />

              {/* Anterior Deltoids (Spalle Anteriori) */}
              <circle 
                cx="31" 
                cy="37" 
                r="7" 
                fill={isDelts ? 'url(#targetRedPulse)' : isPecs ? 'url(#synergistGreen)' : '#334155'} 
                filter={isDelts ? 'url(#muscleGlow)' : undefined}
                className={isDelts ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'delts-ant',
                  name: 'Deltoide Anteriore',
                  latinName: 'Deltoideus Clavicularis',
                  role: isDelts ? 'primary' : isPecs ? 'synergist' : 'stabilizer',
                  activationPercent: isDelts ? 100 : isPecs ? 75 : 20,
                  description: 'Spinge e stabilizza il braccio in flessione anteriore e adduzione orizzontale.'
                })}
              />
              <circle 
                cx="69" 
                cy="37" 
                r="7" 
                fill={isDelts ? 'url(#targetRedPulse)' : isPecs ? 'url(#synergistGreen)' : '#334155'} 
                filter={isDelts ? 'url(#muscleGlow)' : undefined}
                className={isDelts ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'delts-ant',
                  name: 'Deltoide Anteriore',
                  latinName: 'Deltoideus Clavicularis',
                  role: isDelts ? 'primary' : isPecs ? 'synergist' : 'stabilizer',
                  activationPercent: isDelts ? 100 : isPecs ? 75 : 20,
                  description: 'Spinge e stabilizza il braccio in flessione anteriore e adduzione orizzontale.'
                })}
              />

              {/* Clavicular & Sternocostal Pectorals (Grande Pettorale) */}
              <path 
                d="M 37 34 Q 50 37 39 52 Q 31 46 37 34 Z" 
                fill={isPecs ? 'url(#targetRedPulse)' : '#334155'} 
                filter={isPecs ? 'url(#muscleGlow)' : undefined}
                className={isPecs ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'pecs',
                  name: 'Grande Pettorale (Fasci Sterno-Costali e Clavicolari)',
                  latinName: 'Pectoralis Major',
                  role: isPecs ? 'primary' : 'stabilizer',
                  activationPercent: isPecs ? 100 : 15,
                  description: 'Motore primario della Chest Press e Croci. Adduce e intraruota l\'omero.'
                })}
              />
              <path 
                d="M 63 34 Q 50 37 61 52 Q 69 46 63 34 Z" 
                fill={isPecs ? 'url(#targetRedPulse)' : '#334155'} 
                filter={isPecs ? 'url(#muscleGlow)' : undefined}
                className={isPecs ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'pecs',
                  name: 'Grande Pettorale',
                  latinName: 'Pectoralis Major',
                  role: isPecs ? 'primary' : 'stabilizer',
                  activationPercent: isPecs ? 100 : 15,
                  description: 'Motore primario della Chest Press e Croci. Adduce e intraruota l\'omero.'
                })}
              />

              {/* Biceps Brachii (Bicipiti) */}
              <rect 
                x="24" 
                y="46" 
                width="7" 
                height="16" 
                rx="3.5" 
                fill={isBiceps ? 'url(#targetRedPulse)' : isBack ? 'url(#synergistGreen)' : '#334155'} 
                filter={isBiceps ? 'url(#muscleGlow)' : undefined}
                className={isBiceps ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'biceps',
                  name: 'Bicipite Brachiale (Capo Lungo e Breve)',
                  latinName: 'Biceps Brachii',
                  role: isBiceps ? 'primary' : isBack ? 'synergist' : 'stabilizer',
                  activationPercent: isBiceps ? 100 : isBack ? 65 : 10,
                  description: 'Flessione del gomito e supinazione dell\'avambraccio.'
                })}
              />
              <rect 
                x="69" 
                y="46" 
                width="7" 
                height="16" 
                rx="3.5" 
                fill={isBiceps ? 'url(#targetRedPulse)' : isBack ? 'url(#synergistGreen)' : '#334155'} 
                filter={isBiceps ? 'url(#muscleGlow)' : undefined}
                className={isBiceps ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'biceps',
                  name: 'Bicipite Brachiale',
                  latinName: 'Biceps Brachii',
                  role: isBiceps ? 'primary' : isBack ? 'synergist' : 'stabilizer',
                  activationPercent: isBiceps ? 100 : isBack ? 65 : 10,
                  description: 'Flessione del gomito e supinazione dell\'avambraccio.'
                })}
              />

              {/* Forearms Anterior (Brachioradiale & Flessori) */}
              <rect x="22" y="64" width="6" height="18" rx="3" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />
              <rect x="72" y="64" width="6" height="18" rx="3" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />

              {/* Rectus Abdominis & Obliques (Addominali) */}
              <rect 
                x="41" 
                y="54" 
                width="18" 
                height="30" 
                rx="5" 
                fill={isAbs ? 'url(#targetRedPulse)' : '#1E293B'} 
                filter={isAbs ? 'url(#muscleGlow)' : undefined}
                className={isAbs ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'abs',
                  name: 'Retto Addominale & Obliqui',
                  latinName: 'Rectus Abdominis',
                  role: isAbs ? 'primary' : 'stabilizer',
                  activationPercent: isAbs ? 100 : 35,
                  description: 'Flette la colonna e retroverte il bacino nel reverse crunch.'
                })}
              />
              {/* Abdominal Tendinous Intersections */}
              <line x1="50" y1="55" x2="50" y2="82" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="43" y1="63" x2="57" y2="63" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="43" y1="72" x2="57" y2="72" stroke="#0F172A" strokeWidth="1.2" />

              {/* Pelvis & Hips */}
              <polygon points="39,85 61,85 50,96" fill="#334155" />

              {/* Quadriceps Femoris (Quadricipiti) */}
              <rect 
                x="34" 
                y="97" 
                width="13.5" 
                height="33" 
                rx="6" 
                fill={isQuads ? 'url(#targetRedPulse)' : '#334155'} 
                filter={isQuads ? 'url(#muscleGlow)' : undefined}
                className={isQuads ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'quads',
                  name: 'Quadricipite Femorale (Vasto Mediale, Laterale e Retto)',
                  latinName: 'Quadriceps Femoris',
                  role: isQuads ? 'primary' : 'stabilizer',
                  activationPercent: isQuads ? 100 : 25,
                  description: 'Estensione potente del ginocchio nella Pressa 45°.'
                })}
              />
              <rect 
                x="52.5" 
                y="97" 
                width="13.5" 
                height="33" 
                rx="6" 
                fill={isQuads ? 'url(#targetRedPulse)' : '#334155'} 
                filter={isQuads ? 'url(#muscleGlow)' : undefined}
                className={isQuads ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'quads',
                  name: 'Quadricipite Femorale',
                  latinName: 'Quadriceps Femoris',
                  role: isQuads ? 'primary' : 'stabilizer',
                  activationPercent: isQuads ? 100 : 25,
                  description: 'Estensione potente del ginocchio nella Pressa 45°.'
                })}
              />

              {/* Tibialis & Calves front */}
              <rect x="37" y="133" width="9" height="26" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />
              <rect x="54" y="133" width="9" height="26" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />
            </svg>
          </div>
        )}

        {/* --- BACK ANATOMICAL SILHOUETTE --- */}
        {(viewAngle === 'both' || viewAngle === 'back') && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono font-bold text-emerald-400/90 mb-2 tracking-wider flex items-center gap-1">
              <span>●</span> VISTA POSTERIORE (POSTERIOR)
            </span>
            <svg 
              viewBox="0 0 100 170" 
              className="w-32 h-48 sm:w-36 sm:h-56 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] cursor-pointer select-none"
            >
              {/* Head back */}
              <circle cx="50" cy="16" r="9" fill="#1E293B" stroke="#334155" strokeWidth="1" />
              <path d="M 46 25 L 54 25 L 56 31 L 44 31 Z" fill="#334155" />

              {/* Trapezius (Trapezio Superiore & Medio) */}
              <path 
                d="M 37 32 L 63 32 L 50 49 Z" 
                fill={isBack ? 'url(#synergistGreen)' : isDelts ? 'url(#stabilizerCyan)' : '#334155'} 
                className="hover:opacity-80"
                onClick={() => setSelectedMuscle({
                  id: 'traps',
                  name: 'Trapezio (Fasci Medi e Superiori)',
                  latinName: 'Trapezius',
                  role: isBack ? 'synergist' : 'stabilizer',
                  activationPercent: isBack ? 75 : 30,
                  description: 'Eleva e adduce le scapole nel rematore e pulley.'
                })}
              />

              {/* Posterior Deltoids (Deltoidi Posteriori) */}
              <circle 
                cx="30" 
                cy="37" 
                r="7" 
                fill={isRearDelts ? 'url(#targetRedPulse)' : isBack ? 'url(#synergistGreen)' : '#334155'} 
                filter={isRearDelts ? 'url(#muscleGlow)' : undefined}
                className={isRearDelts ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'delts-post',
                  name: 'Deltoide Posteriore',
                  latinName: 'Deltoideus Posterior',
                  role: isRearDelts ? 'primary' : isBack ? 'synergist' : 'stabilizer',
                  activationPercent: isRearDelts ? 100 : isBack ? 60 : 15,
                  description: 'Estende orizzontalmente l\'omero ed extra-ruota nelle alzate a 60°.'
                })}
              />
              <circle 
                cx="70" 
                cy="37" 
                r="7" 
                fill={isRearDelts ? 'url(#targetRedPulse)' : isBack ? 'url(#synergistGreen)' : '#334155'} 
                filter={isRearDelts ? 'url(#muscleGlow)' : undefined}
                className={isRearDelts ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'delts-post',
                  name: 'Deltoide Posteriore',
                  latinName: 'Deltoideus Posterior',
                  role: isRearDelts ? 'primary' : isBack ? 'synergist' : 'stabilizer',
                  activationPercent: isRearDelts ? 100 : isBack ? 60 : 15,
                  description: 'Estende orizzontalmente l\'omero ed extra-ruota nelle alzate a 60°.'
                })}
              />

              {/* Triceps Brachii (Tricipiti) */}
              <rect 
                x="23" 
                y="46" 
                width="7" 
                height="16" 
                rx="3.5" 
                fill={isTriceps ? 'url(#targetRedPulse)' : isPecs ? 'url(#synergistGreen)' : '#334155'} 
                filter={isTriceps ? 'url(#muscleGlow)' : undefined}
                className={isTriceps ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'triceps',
                  name: 'Tricipite Brachiale (Capo Lungo, Laterale e Mediale)',
                  latinName: 'Triceps Brachii',
                  role: isTriceps ? 'primary' : isPecs ? 'synergist' : 'stabilizer',
                  activationPercent: isTriceps ? 100 : isPecs ? 65 : 10,
                  description: 'Estensore del gomito in push-down, chest press e french press.'
                })}
              />
              <rect 
                x="70" 
                y="46" 
                width="7" 
                height="16" 
                rx="3.5" 
                fill={isTriceps ? 'url(#targetRedPulse)' : isPecs ? 'url(#synergistGreen)' : '#334155'} 
                filter={isTriceps ? 'url(#muscleGlow)' : undefined}
                className={isTriceps ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'triceps',
                  name: 'Tricipite Brachiale',
                  latinName: 'Triceps Brachii',
                  role: isTriceps ? 'primary' : isPecs ? 'synergist' : 'stabilizer',
                  activationPercent: isTriceps ? 100 : isPecs ? 65 : 10,
                  description: 'Estensore del gomito in push-down, chest press e french press.'
                })}
              />

              {/* Latissimus Dorsi (Gran Dorsale) */}
              <path 
                d="M 35 44 Q 50 48 37 70 Q 31 56 35 44 Z" 
                fill={isBack ? 'url(#targetRedPulse)' : '#334155'} 
                filter={isBack ? 'url(#muscleGlow)' : undefined}
                className={isBack ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'lats',
                  name: 'Gran Dorsale & Grande Rotondo',
                  latinName: 'Latissimus Dorsi',
                  role: isBack ? 'primary' : 'stabilizer',
                  activationPercent: isBack ? 100 : 20,
                  description: 'Adduce ed estende l\'omero nel Pulley e Pull Down Machine.'
                })}
              />
              <path 
                d="M 65 44 Q 50 48 63 70 Q 69 56 65 44 Z" 
                fill={isBack ? 'url(#targetRedPulse)' : '#334155'} 
                filter={isBack ? 'url(#muscleGlow)' : undefined}
                className={isBack ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'lats',
                  name: 'Gran Dorsale & Grande Rotondo',
                  latinName: 'Latissimus Dorsi',
                  role: isBack ? 'primary' : 'stabilizer',
                  activationPercent: isBack ? 100 : 20,
                  description: 'Adduce ed estende l\'omero nel Pulley e Pull Down Machine.'
                })}
              />

              {/* Erector Spinae / Lower Back (Lombari) */}
              <rect 
                x="43" 
                y="62" 
                width="14" 
                height="22" 
                rx="3.5" 
                fill={isLowerBack ? 'url(#targetRedPulse)' : isBack ? 'url(#stabilizerCyan)' : '#1E293B'} 
                filter={isLowerBack ? 'url(#muscleGlow)' : undefined}
                className={isLowerBack ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'erectors',
                  name: 'Erettori Spinali & Fascia Toracolombare',
                  latinName: 'Erector Spinae',
                  role: isLowerBack ? 'primary' : 'stabilizer',
                  activationPercent: isLowerBack ? 100 : 45,
                  description: 'Estende la colonna nell\'Hiperextension e stabilizza il pulley.'
                })}
              />

              {/* Gluteus Maximus (Glutei) */}
              <circle 
                cx="42" 
                cy="90" 
                r="8.5" 
                fill={isLowerBack || isQuads ? 'url(#stabilizerCyan)' : '#334155'} 
                className="hover:opacity-80"
              />
              <circle 
                cx="58" 
                cy="90" 
                r="8.5" 
                fill={isLowerBack || isQuads ? 'url(#stabilizerCyan)' : '#334155'} 
                className="hover:opacity-80"
              />

              {/* Hamstrings (Femorali / Ischiocrurali) */}
              <rect 
                x="34" 
                y="100" 
                width="13" 
                height="30" 
                rx="5" 
                fill={isHamstrings ? 'url(#targetRedPulse)' : isQuads ? 'url(#stabilizerCyan)' : '#334155'} 
                filter={isHamstrings ? 'url(#muscleGlow)' : undefined}
                className={isHamstrings ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'hamstrings',
                  name: 'Bicipite Femorale & Semitendinoso',
                  latinName: 'Ischiocruralis',
                  role: isHamstrings ? 'primary' : 'stabilizer',
                  activationPercent: isHamstrings ? 100 : 35,
                  description: 'Flessione del ginocchio nel Leg Curl Seduto ed estensione dell\'anca.'
                })}
              />
              <rect 
                x="53" 
                y="100" 
                width="13" 
                height="30" 
                rx="5" 
                fill={isHamstrings ? 'url(#targetRedPulse)' : isQuads ? 'url(#stabilizerCyan)' : '#334155'} 
                filter={isHamstrings ? 'url(#muscleGlow)' : undefined}
                className={isHamstrings ? 'animate-pulse' : 'hover:opacity-80'}
                onClick={() => setSelectedMuscle({
                  id: 'hamstrings',
                  name: 'Bicipite Femorale',
                  latinName: 'Ischiocruralis',
                  role: isHamstrings ? 'primary' : 'stabilizer',
                  activationPercent: isHamstrings ? 100 : 35,
                  description: 'Flessione del ginocchio nel Leg Curl Seduto ed estensione dell\'anca.'
                })}
              />

              {/* Calves (Polpacci - Gastrocnemio) */}
              <rect x="36" y="133" width="10" height="25" rx="4.5" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />
              <rect x="54" y="133" width="10" height="25" rx="4.5" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />
            </svg>
          </div>
        )}
      </div>

      {/* Selected Muscle Interactive Inspector Sheet */}
      {selectedMuscle ? (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                {selectedMuscle.role === 'primary' ? '★ Target Primario' : selectedMuscle.role === 'synergist' ? 'Sinergico' : 'Stabilizzatore'}
              </span>
              <h5 className="text-sm font-extrabold text-white">{selectedMuscle.name}</h5>
              <span className="text-[10px] font-mono text-slate-400 italic">lat. {selectedMuscle.latinName}</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-amber-400 tabular-nums">
                {selectedMuscle.activationPercent}%
              </span>
              <span className="block text-[9px] text-slate-400 uppercase">Attivazione</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            {selectedMuscle.description}
          </p>
        </div>
      ) : (
        /* Default Activation Summary */
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Muscolo Bersaglio Principale:</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">{primaryMuscleName}</span>
          </div>

          {/* Activation bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Intensità Motore Primario</span>
              <span className="text-red-400 font-bold">100% (Focalizzato)</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 rounded-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Legend */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-slate-300 font-bold truncate">Primario (100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-400 truncate">Sinergico (65%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
          <span className="text-slate-400 truncate">Stabilizzatore</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 text-center font-mono">
        💡 Tocca qualunque muscolo sulla silhouette per esplorare anatomia e funzione biomeccanica
      </p>
    </div>
  );
};
