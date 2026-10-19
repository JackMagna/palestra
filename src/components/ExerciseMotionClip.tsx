import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Eye, 
  Dumbbell, 
  Sparkles, 
  Gauge, 
  Maximize2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { ExerciseDBItem } from '../data/exerciseDb';
import { MuscleVisualizer } from './MuscleVisualizer';

interface ExerciseMotionClipProps {
  exercise: ExerciseDBItem;
  exerciseIndex: number;
  totalExercises: number;
}

export const ExerciseMotionClip: React.FC<ExerciseMotionClipProps> = ({
  exercise,
  exerciseIndex,
  totalExercises
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [motionPhase, setMotionPhase] = useState<'eccentrica' | 'isometrica' | 'concentrica'>('eccentrica');
  const [phaseProgress, setPhaseProgress] = useState(0); // 0 to 100
  const [viewMode, setViewMode] = useState<'machine3d' | 'musclemap' | 'cues'>('machine3d');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 0.75x, 1.25x

  // Biomechanical cadence cycle: 2.2s eccentric descent, 0.6s isometric pause, 1.2s explosive concentric
  // Total duration: 4.0s (scaled by playbackSpeed)
  useEffect(() => {
    if (!isPlaying) return;

    let startTime = Date.now();
    const baseCycleDuration = 4000;
    const cycleDuration = baseCycleDuration / playbackSpeed;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % cycleDuration;
      const progress = (elapsed / cycleDuration) * 100;
      setPhaseProgress(progress);

      const ratio = elapsed / cycleDuration;
      if (ratio < 0.55) {
        setMotionPhase('eccentrica'); // 2.2s controlled negative
      } else if (ratio < 0.70) {
        setMotionPhase('isometrica'); // 0.6s peak stretch / contraction
      } else {
        setMotionPhase('concentrica'); // 1.2s explosive lift
      }
    }, 35);

    return () => clearInterval(interval);
  }, [isPlaying, exercise.id, playbackSpeed]);

  // Normalized displacement: 0 at resting start, 1 at peak contraction/stretch
  const displacement = motionPhase === 'eccentrica'
    ? phaseProgress / 55
    : motionPhase === 'isometrica'
      ? 1
      : 1 - ((phaseProgress - 70) / 30);

  const cleanOffset = Math.max(0, Math.min(1, displacement));

  // Exercise ID detection for all 14 exercises in Giacomo & Dario routine
  const exId = exercise.id;
  const isChestPress = exId.includes('chest');
  const isPulleyRow = exId.includes('pulley') || exId.includes('row');
  const isCableFly = exId.includes('croci') || exId.includes('fly');
  const isLatPull = exId.includes('pull-down');
  const isLento70 = exId.includes('lento');
  const isAlzate60 = exId.includes('alzate');
  const isReverseCrunch = exId.includes('crunch');
  const isLegPress = exId.includes('pressa');
  const isLegCurl = exId.includes('leg-curl');
  const isCurlBarbell = exId.includes('curl-bilanciere');
  const isPushDown = exId.includes('push-down');
  const isCurlIncline45 = exId.includes('curl-manubri-panca-45');
  const isFrenchPress = exId.includes('french');
  const isHiperextension = exId.includes('hiper');

  return (
    <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Header & Segmented View Switcher */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            {isChestPress ? 'Macchinario Chest Press Guidata'
              : isPulleyRow ? 'Pulley Basso con Triangolo V-Bar'
              : isCableFly ? 'Croci Cavi Crossover Alti'
              : isLatPull ? 'Trazioni Lat Pulldown Machine'
              : isLento70 ? 'Lento Manubri Panca 70°'
              : isAlzate60 ? 'Alzate Laterali Prono Panca 60°'
              : isReverseCrunch ? 'Reverse Crunch Panca Declinata'
              : isLegPress ? 'Pressa Lineare 45°'
              : isLegCurl ? 'Leg Curl Seduto Macchina'
              : isCurlBarbell ? 'Curl Bicipiti Bilanciere'
              : isPushDown ? 'Push Down Tricipiti Cavi'
              : isCurlIncline45 ? 'Curl Manubri Panca Inclinata 45°'
              : isFrenchPress ? 'French Press Manubri Piana'
              : isHiperextension ? 'Hiperextension Panca 45°'
              : 'Rendering Biomeccanico'}
          </span>
        </div>

        {/* View mode toggle: 3D Machine / Muscle Visualizer / Cues */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 gap-1">
          <button
            onClick={() => setViewMode('machine3d')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'machine3d'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>3D Macchina</span>
          </button>
          <button
            onClick={() => setViewMode('musclemap')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'musclemap'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Muscle Visualizer</span>
          </button>
          <button
            onClick={() => setViewMode('cues')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'cues'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Guida</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'machine3d' && (
        <div className="relative h-64 sm:h-72 w-full bg-gradient-to-b from-[#070D18] via-slate-950 to-slate-950 flex flex-col items-center justify-center p-3 overflow-hidden select-none">
          {/* Gym grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B20_1px,transparent_1px),linear-gradient(to_bottom,#1E293B20_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

          {/* Machine & Athlete SVG Kinematic Canvas */}
          <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center">
            <svg viewBox="0 0 340 210" className="w-full h-48 sm:h-52 drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]">
              <defs>
                <linearGradient id="metalChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
                <linearGradient id="chromeRods" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#CBD5E1" />
                  <stop offset="50%" stopColor="#F1F5F9" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>
                <radialGradient id="muscleTargetGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="70%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#7F1D1D" />
                </radialGradient>
                <filter id="glowEffect">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Floor baseline line */}
              <line x1="20" y1="185" x2="320" y2="185" stroke="#1E293B" strokeWidth="3" strokeDasharray="6 4" />

              {/* 1. CHEST PRESS PRESA SOPRA */}
              {isChestPress && (
                <g>
                  {/* Weight stack column */}
                  <rect x="250" y="30" width="46" height="150" rx="6" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                  <line x1="262" y1="36" x2="262" y2="174" stroke="url(#chromeRods)" strokeWidth="3" />
                  <line x1="284" y1="36" x2="284" y2="174" stroke="url(#chromeRods)" strokeWidth="3" />
                  {/* Moving weight stack plates */}
                  <rect x="255" y={45 + (1 - cleanOffset) * 35} width="36" height="14" rx="2" fill="#F59E0B" />
                  <rect x="255" y={61 + (1 - cleanOffset) * 35} width="36" height="14" rx="2" fill="#CBD5E1" />
                  <rect x="255" y={77 + (1 - cleanOffset) * 35} width="36" height="14" rx="2" fill="#94A3B8" />
                  {/* Cable pulley wire */}
                  <line x1="273" y1="35" x2="180" y2={95 - cleanOffset * 18} stroke="#CBD5E1" strokeWidth="2.5" />
                  <circle cx="273" cy="35" r="5" fill="#F59E0B" />

                  {/* Machine seat, frame and footrest */}
                  <rect x="70" y="80" width="16" height="85" rx="4" fill="#334155" />
                  <rect x="80" y="145" width="45" height="14" rx="3" fill="#334155" />
                  <rect x="90" y="159" width="14" height="26" fill="#1E293B" />

                  {/* Athlete Seated upright */}
                  <circle cx="95" cy="68" r="13" fill="#F8FAFC" />
                  <rect x="86" y="82" width="20" height="52" rx="8" fill="#1E293B" />
                  {/* Pectoral contraction glow */}
                  <path 
                    d="M 94 86 Q 108 92 94 108 Z" 
                    fill="url(#muscleTargetGlow)" 
                    filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} 
                    className={cleanOffset > 0.4 ? 'animate-pulse' : ''}
                  />

                  {/* Pressing arm and lever */}
                  <line x1="94" y1="92" x2={125 + cleanOffset * 32} y2={98 - cleanOffset * 8} stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                  <line x1={125 + cleanOffset * 32} y1={98 - cleanOffset * 8} x2={165 + cleanOffset * 36} y2={92 - cleanOffset * 12} stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" />
                  {/* Guide lever connected to chassis */}
                  <line x1="180" y1="160" x2={165 + cleanOffset * 36} y2={92 - cleanOffset * 12} stroke="url(#chromeRods)" strokeWidth="7" strokeLinecap="round" />
                  <rect x={161 + cleanOffset * 36} y={82 - cleanOffset * 12} width="8" height="22" rx="3" fill="#F59E0B" />
                </g>
              )}

              {/* 2. REMATORE AL PULLEY TRIANGOLO */}
              {isPulleyRow && (
                <g>
                  {/* Low pulley frame and footrests */}
                  <rect x="60" y="150" width="165" height="15" rx="4" fill="#334155" />
                  <polygon points="195,130 215,150 190,150" fill="#64748B" />
                  <rect x="85" y="132" width="65" height="18" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

                  {/* Pulley wheel and cable */}
                  <circle cx="225" cy="142" r="8" fill="#F59E0B" />
                  <line x1="225" y1="142" x2={140 - cleanOffset * 28} y2={114 - cleanOffset * 10} stroke="#CBD5E1" strokeWidth="3" />
                  {/* V-bar Triangle */}
                  <polygon points={`${140 - cleanOffset * 28},${108 - cleanOffset * 10} ${146 - cleanOffset * 28},${120 - cleanOffset * 10} ${134 - cleanOffset * 28},${114 - cleanOffset * 10}`} fill="#F59E0B" />

                  {/* Athlete Seated pulling triangle */}
                  <circle cx="102" cy="85" r="13" fill="#F8FAFC" />
                  <rect x="96" y="98" width="16" height="42" rx="7" fill="#1E293B" />
                  {/* Dorsal Latissimus squeeze glow */}
                  <path 
                    d="M 94 102 Q 80 114 94 128 Z" 
                    fill="url(#muscleTargetGlow)" 
                    filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined}
                    className={cleanOffset > 0.4 ? 'animate-pulse' : ''}
                  />

                  {/* Pulling arms with elbows traveling back */}
                  <line x1="98" y1="106" x2={116 - cleanOffset * 18} y2={118 - cleanOffset * 5} stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                  <line x1={116 - cleanOffset * 18} y1={118 - cleanOffset * 5} x2={140 - cleanOffset * 28} y2={114 - cleanOffset * 10} stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" />
                  {/* Legs braced against footplates */}
                  <line x1="106" y1="138" x2="155" y2="140" stroke="#475569" strokeWidth="9" strokeLinecap="round" />
                  <line x1="155" y1="140" x2="198" y2="138" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                </g>
              )}

              {/* 3. CROCI AI CAVI ALTI (Cable Crossover) */}
              {isCableFly && (
                <g>
                  {/* Dual high cable towers left and right */}
                  <rect x="25" y="25" width="22" height="155" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                  <rect x="290" y="25" width="22" height="155" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                  <circle cx="36" cy="38" r="7" fill="#F59E0B" />
                  <circle cx="301" cy="38" r="7" fill="#F59E0B" />

                  {/* Moving high cables down towards midline */}
                  <line x1="36" y1="38" x2={125 + cleanOffset * 35} y2={95 + cleanOffset * 28} stroke="#CBD5E1" strokeWidth="2.5" />
                  <line x1="301" y1="38" x2={210 - cleanOffset * 35} y2={95 + cleanOffset * 28} stroke="#CBD5E1" strokeWidth="2.5" />

                  {/* Standing athlete in staggered stance */}
                  <circle cx="168" cy="72" r="14" fill="#F8FAFC" />
                  <rect x="159" y="86" width="18" height="52" rx="8" fill="#1E293B" />
                  {/* Pectoral hug glow */}
                  <circle cx="168" cy="100" r="10" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Left and right sweeping arms hugging a barrel */}
                  <line x1="162" y1="94" x2={125 + cleanOffset * 35} y2={95 + cleanOffset * 28} stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                  <line x1="174" y1="94" x2={210 - cleanOffset * 35} y2={95 + cleanOffset * 28} stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                  {/* Cable D-handles */}
                  <circle cx={125 + cleanOffset * 35} cy={95 + cleanOffset * 28} r="5" fill="#CBD5E1" />
                  <circle cx={210 - cleanOffset * 35} cy={95 + cleanOffset * 28} r="5" fill="#CBD5E1" />
                </g>
              )}

              {/* 4. TRAZIONI AL PULL DOWN MACHINE */}
              {isLatPull && (
                <g>
                  {/* Overhead pulldown machine frame */}
                  <path d="M 120 180 L 120 35 Q 120 20 145 20 L 225 20" fill="none" stroke="#334155" strokeWidth="10" />
                  <circle cx="170" cy="20" r="7" fill="#F59E0B" />
                  <line x1="170" y1="20" x2="170" y2={45 + cleanOffset * 32} stroke="#CBD5E1" strokeWidth="3" />
                  {/* Wide curved pulldown bar */}
                  <path d={`M 125 ${48 + cleanOffset * 32} Q 170 ${42 + cleanOffset * 32} 215 ${48 + cleanOffset * 32}`} fill="none" stroke="url(#chromeRods)" strokeWidth="6" strokeLinecap="round" />

                  {/* Seat & Thigh hold pad */}
                  <rect x="150" y="125" width="40" height="14" rx="4" fill="#1E293B" />
                  <rect x="155" y="105" width="30" height="10" rx="3" fill="#475569" />

                  {/* Athlete seated pulling bar to chest */}
                  <circle cx="170" cy="78" r="13" fill="#F8FAFC" />
                  <rect x="162" y="90" width="16" height="44" rx="7" fill="#1E293B" />
                  {/* Dorsal wings flaring */}
                  <path d="M 158 94 Q 144 110 158 124 Z" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />
                  <path d="M 182 94 Q 196 110 182 124 Z" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Pulling arms with elbows driving down */}
                  <line x1="163" y1="94" x2={140 - cleanOffset * 10} y2={62 + cleanOffset * 22} stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                  <line x1={140 - cleanOffset * 10} y1={62 + cleanOffset * 22} x2="132" y2={48 + cleanOffset * 32} stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" />
                  <line x1="177" y1="94" x2={200 + cleanOffset * 10} y2={62 + cleanOffset * 22} stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                  <line x1={200 + cleanOffset * 10} y1={62 + cleanOffset * 22} x2="208" y2={48 + cleanOffset * 32} stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" />
                </g>
              )}

              {/* 5. LENTO MANUBRI PANCA 70° */}
              {isLento70 && (
                <g>
                  {/* 70-degree inclined bench */}
                  <rect x="120" y="80" width="15" height="90" rx="3" transform="rotate(-20 120 80)" fill="#334155" />
                  <rect x="120" y="145" width="45" height="15" rx="3" fill="#1E293B" />

                  {/* Athlete seated */}
                  <circle cx="145" cy="72" r="13" fill="#F8FAFC" />
                  <rect x="138" y="86" width="18" height="48" rx="8" fill="#1E293B" />

                  {/* Deltoids active glow */}
                  <circle cx="132" cy="90" r="7" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />
                  <circle cx="162" cy="90" r="7" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Dumbbells pressing overhead from shoulder to apex */}
                  <line x1="134" y1="90" x2={125 - cleanOffset * 5} y2={85 - cleanOffset * 35} stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                  <line x1="160" y1="90" x2={169 + cleanOffset * 5} y2={85 - cleanOffset * 35} stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                  {/* Hex Dumbbells */}
                  <rect x={117 - cleanOffset * 5} y={75 - cleanOffset * 35} width="16" height="10" rx="2" fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
                  <rect x={161 + cleanOffset * 5} y={75 - cleanOffset * 35} width="16" height="10" rx="2" fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
                </g>
              )}

              {/* 6. ALZATE LATERALI PRONO PANCA 60° */}
              {isAlzate60 && (
                <g>
                  {/* 60° incline bench with chest resting on pad */}
                  <rect x="100" y="90" width="16" height="85" rx="4" transform="rotate(30 100 90)" fill="#334155" />

                  {/* Athlete lying chest down */}
                  <circle cx="150" cy="78" r="13" fill="#F8FAFC" />
                  <rect x="135" y="88" width="28" height="20" rx="6" fill="#1E293B" transform="rotate(30 135 88)" />

                  {/* Rear Deltoids & Rhomboids focus glow */}
                  <circle cx="156" cy="86" r="8" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Arms raising laterally to horizontal plane */}
                  <line x1="148" y1="92" x2={100 - cleanOffset * 30} y2={120 - cleanOffset * 35} stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
                  <line x1="158" y1="92" x2={206 + cleanOffset * 30} y2={120 - cleanOffset * 35} stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
                  {/* Dumbbells hanging / flying */}
                  <circle cx={100 - cleanOffset * 30} cy={120 - cleanOffset * 35} r="7" fill="#CBD5E1" />
                  <circle cx={206 + cleanOffset * 30} cy={120 - cleanOffset * 35} r="7" fill="#CBD5E1" />
                </g>
              )}

              {/* 7. REVERSE CRUNCH PANCA DECLINATA */}
              {isReverseCrunch && (
                <g>
                  {/* 30° decline bench */}
                  <line x1="70" y1="110" x2="250" y2="165" stroke="#334155" strokeWidth="14" strokeLinecap="round" />
                  <line x1="60" y1="105" x2="60" y2="175" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />

                  {/* Head handles */}
                  <circle cx="85" cy="100" r="5" fill="#F59E0B" />

                  {/* Athlete lying with head at high end, hands on handles */}
                  <circle cx="95" cy="115" r="12" fill="#F8FAFC" />
                  <line x1="95" y1="120" x2="85" y2="102" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
                  <rect x="105" y="125" width="40" height="15" rx="5" transform={`rotate(${15 - cleanOffset * 25} 105 125)`} fill="#1E293B" />

                  {/* Lower abs contracting */}
                  <circle cx="130" cy="130" r="9" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Pelvis & bent knees curling up towards sternum */}
                  <g transform={`translate(${cleanOffset * -15}, ${cleanOffset * -25})`}>
                    <line x1="145" y1="140" x2="165" y2="120" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                    <line x1="165" y1="120" x2="185" y2="135" stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" />
                  </g>
                </g>
              )}

              {/* 8. PRESSA 45° (Linear Leg Press) */}
              {isLegPress && (
                <g>
                  {/* 45 degree heavy incline frame rails */}
                  <line x1="55" y1="170" x2="255" y2="35" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                  <line x1="75" y1="180" x2="275" y2="45" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />

                  {/* High footplate at top of 45° track */}
                  <rect x="250" y="25" width="18" height="45" rx="4" transform="rotate(-45 250 25)" fill="#64748B" />

                  {/* 45° Sled with weight plates sliding up & down */}
                  <g transform={`translate(${cleanOffset * 45}, ${-cleanOffset * 32})`}>
                    <rect x="145" y="80" width="46" height="32" rx="5" transform="rotate(-45 145 80)" fill="#F59E0B" />
                    <circle cx="160" cy="90" r="16" fill="#0F172A" stroke="#CBD5E1" strokeWidth="4" />
                    <circle cx="160" cy="90" r="7" fill="#DC2626" />
                  </g>

                  {/* Athlete seated in 45° bucket seat */}
                  <rect x="65" y="125" width="42" height="15" rx="3" transform="rotate(35 65 125)" fill="#475569" />
                  <circle cx="68" cy="118" r="13" fill="#F8FAFC" />
                  <rect x="78" y="132" width="28" height="16" rx="4" fill="#1E293B" />

                  {/* Quadriceps glowing */}
                  <circle cx="120" cy="120" r="10" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Leg extension/flexion vector */}
                  <line x1="88" y1="138" x2={125 + cleanOffset * 24} y2={110 - cleanOffset * 16} stroke="#EC4899" strokeWidth="11" strokeLinecap="round" />
                  <line x1={125 + cleanOffset * 24} y1={110 - cleanOffset * 16} x2={185 + cleanOffset * 42} y2={65 - cleanOffset * 28} stroke="#F8FAFC" strokeWidth="9" strokeLinecap="round" />
                </g>
              )}

              {/* 9. LEG CURL SEDUTO */}
              {isLegCurl && (
                <g>
                  {/* Seated machine chair and thigh clamp */}
                  <rect x="90" y="90" width="16" height="75" rx="4" fill="#334155" />
                  <rect x="95" y="140" width="60" height="16" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                  <rect x="135" y="120" width="25" height="12" rx="3" fill="#F59E0B" />

                  {/* Athlete seated with thighs locked under pad */}
                  <circle cx="108" cy="78" r="13" fill="#F8FAFC" />
                  <rect x="102" y="92" width="18" height="48" rx="8" fill="#1E293B" />

                  {/* Hamstrings firing behind thighs */}
                  <circle cx="125" cy="145" r="9" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Thigh horizontal on seat */}
                  <line x1="115" y1="140" x2="160" y2="140" stroke="#475569" strokeWidth="10" strokeLinecap="round" />

                  {/* Lower leg curling downward and back behind seat */}
                  <line x1="160" y1="140" x2={165 - cleanOffset * 25} y2={180 - cleanOffset * 5} stroke="#F8FAFC" strokeWidth="8" strokeLinecap="round" />
                  {/* Roller pad behind Achilles */}
                  <circle cx={165 - cleanOffset * 25} cy={180 - cleanOffset * 5} r="8" fill="#F59E0B" stroke="#CBD5E1" strokeWidth="2" />
                </g>
              )}

              {/* 10. CURL BILANCIERE (Standing Barbell Curl) */}
              {isCurlBarbell && (
                <g>
                  {/* Standing athlete */}
                  <circle cx="150" cy="55" r="13" fill="#F8FAFC" />
                  <rect x="142" y="68" width="16" height="54" rx="7" fill="#1E293B" />
                  <line x1="146" y1="122" x2="142" y2="182" stroke="#334155" strokeWidth="9" strokeLinecap="round" />
                  <line x1="154" y1="122" x2="158" y2="182" stroke="#334155" strokeWidth="9" strokeLinecap="round" />

                  {/* Biceps contraction peak */}
                  <circle cx="158" cy="85" r="8" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Upper arm pinned at side */}
                  <line x1="150" y1="74" x2="155" y2="102" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
                  {/* Forearm curling upward arc */}
                  <line x1="155" y1="102" x2={175 - cleanOffset * 15} y2={130 - cleanOffset * 48} stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" />
                  {/* Olympic Barbell & Discs */}
                  <line x1={160 - cleanOffset * 15} y1={130 - cleanOffset * 48} x2={190 - cleanOffset * 15} y2={130 - cleanOffset * 48} stroke="url(#chromeRods)" strokeWidth="6" strokeLinecap="round" />
                  <circle cx={162 - cleanOffset * 15} cy={130 - cleanOffset * 48} r="10" fill="#DC2626" stroke="#0F172A" strokeWidth="2" />
                  <circle cx={188 - cleanOffset * 15} cy={130 - cleanOffset * 48} r="10" fill="#DC2626" stroke="#0F172A" strokeWidth="2" />
                </g>
              )}

              {/* 11. PUSH DOWN SBARRA AI CAVI */}
              {isPushDown && (
                <g>
                  {/* High pulley cable station */}
                  <rect x="180" y="20" width="40" height="15" rx="3" fill="#334155" />
                  <circle cx="200" cy="28" r="7" fill="#F59E0B" />
                  {/* Cable extending down */}
                  <line x1="200" y1="28" x2="185" y2={70 + cleanOffset * 42} stroke="#CBD5E1" strokeWidth="2.5" />
                  {/* Straight steel bar */}
                  <line x1="170" y1={70 + cleanOffset * 42} x2="200" y2={70 + cleanOffset * 42} stroke="url(#chromeRods)" strokeWidth="5" strokeLinecap="round" />

                  {/* Standing athlete with slight torso incline */}
                  <circle cx="140" cy="62" r="13" fill="#F8FAFC" />
                  <rect x="132" y="75" width="16" height="52" rx="7" fill="#1E293B" transform="rotate(8 132 75)" />

                  {/* Triceps horse-shoe glow */}
                  <circle cx="148" cy="85" r="8" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Upper arm pinned at 90 degrees */}
                  <line x1="140" y1="80" x2="158" y2="95" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
                  {/* Forearms pushing bar down to full lockout */}
                  <line x1="158" y1="95" x2="185" y2={70 + cleanOffset * 42} stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" />
                </g>
              )}

              {/* 12. CURL MANUBRI PANCA 45° */}
              {isCurlIncline45 && (
                <g>
                  {/* 45° inclined bench */}
                  <rect x="100" y="80" width="16" height="85" rx="3" transform="rotate(-35 100 80)" fill="#334155" />
                  <rect x="110" y="145" width="45" height="15" rx="3" fill="#1E293B" />

                  {/* Athlete seated in incline */}
                  <circle cx="130" cy="72" r="13" fill="#F8FAFC" />
                  <rect x="122" y="85" width="18" height="48" rx="8" fill="#1E293B" transform="rotate(-35 122 85)" />

                  {/* Biceps deep stretch and peak */}
                  <circle cx="140" cy="98" r="8" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Arm hanging vertically then curling up */}
                  <line x1="135" y1="90" x2="142" y2="125" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
                  <line x1="142" y1="125" x2={165 - cleanOffset * 15} y2={155 - cleanOffset * 48} stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" />
                  <circle cx={165 - cleanOffset * 15} cy={155 - cleanOffset * 48} r="8" fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
                </g>
              )}

              {/* 13. FRENCH PRESS MANUBRI PIANA */}
              {isFrenchPress && (
                <g>
                  {/* Flat bench */}
                  <rect x="75" y="130" width="140" height="15" rx="3" fill="#334155" />
                  <rect x="90" y="145" width="14" height="35" rx="2" fill="#1E293B" />
                  <rect x="185" y="145" width="14" height="35" rx="2" fill="#1E293B" />

                  {/* Athlete lying supine on bench */}
                  <circle cx="95" cy="120" r="12" fill="#F8FAFC" />
                  <rect x="105" y="118" width="55" height="14" rx="5" fill="#1E293B" />

                  {/* Triceps focus glow */}
                  <circle cx="135" cy="100" r="8" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />

                  {/* Upper arms vertical / angled 10° back */}
                  <line x1="130" y1="120" x2="125" y2="85" stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
                  {/* Forearms pivoting back past the crown of the head */}
                  <line x1="125" y1="85" x2={85 + cleanOffset * 35} y2={85 - cleanOffset * 25} stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" />
                  <circle cx={85 + cleanOffset * 35} cy={85 - cleanOffset * 25} r="7" fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
                </g>
              )}

              {/* 14. HIPEREXTENSION PANCA 45° */}
              {isHiperextension && (
                <g>
                  {/* 45° hyperextension roman bench */}
                  <line x1="80" y1="175" x2="190" y2="85" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                  <rect x="175" y="75" width="30" height="16" rx="4" transform="rotate(-45 175 75)" fill="#F59E0B" />
                  <circle cx="95" cy="165" r="9" fill="#1E293B" stroke="#475569" strokeWidth="3" />

                  {/* Athlete thighs and legs locked in */}
                  <line x1="100" y1="165" x2="175" y2="95" stroke="#334155" strokeWidth="10" strokeLinecap="round" />

                  {/* Torso hinging at the hips */}
                  <g transform={`rotate(${cleanOffset * 35 - 35} 175 95)`}>
                    <rect x="175" y="88" width="45" height="15" rx="5" fill="#1E293B" />
                    <circle cx="225" cy="95" r="12" fill="#F8FAFC" />
                    {/* Erector spinae & glutes glow */}
                    <circle cx="185" cy="95" r="8" fill="url(#muscleTargetGlow)" filter={cleanOffset > 0.3 ? 'url(#glowEffect)' : undefined} />
                  </g>
                </g>
              )}
            </svg>

            {/* Cadence Tempo Phase Banner (Dario PT 3-0-1-0) */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 ${
                motionPhase === 'eccentrica'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : motionPhase === 'isometrica'
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                    : 'bg-indigo-500 text-white ring-2 ring-indigo-300'
              }`}>
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                {motionPhase === 'eccentrica' && 'Discesa Controllata (Eccentrica 2-3s)'}
                {motionPhase === 'isometrica' && 'Massimo Stretch / Picco (0.5s)'}
                {motionPhase === 'concentrica' && 'Spinta Esplosiva (Concentrica 1s)'}
              </span>
            </div>
          </div>

          {/* Bottom Floating Playback Controls */}
          <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-700 backdrop-blur-md">
            {/* Speed toggle */}
            <button
              onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 0.75 : playbackSpeed === 0.75 ? 1.25 : 1)}
              className="px-2 py-1 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white"
              title="Velocità cadenza"
            >
              {playbackSpeed}x
            </button>
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
              title={isPlaying ? 'Pausa' : 'Riproduci'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>
        </div>
      )}

      {/* Embedded Muscle Visualizer API Mode */}
      {viewMode === 'musclemap' && (
        <div className="p-3 bg-slate-950 animate-in fade-in duration-200">
          <MuscleVisualizer exercise={exercise} defaultView="both" />
        </div>
      )}

      {/* Embedded ExerciseDB Cues Mode */}
      {viewMode === 'cues' && (
        <div className="p-4 bg-slate-950 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Istruzioni Biomeccaniche ExerciseDB
            </span>
            <span className="text-[10px] font-mono text-slate-400">{exercise.equipment}</span>
          </div>

          {/* Dario PT Cues */}
          {exercise.trainerCues.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block">
                ★ Direttive Coach Dario PT:
              </span>
              {exercise.trainerCues.map((cue, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-amber-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step-by-Step execution */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300 block">Passaggi Chiave di Esecuzione:</span>
            {exercise.instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise footer bar */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Target:</span>
          <span className="font-bold text-amber-400 truncate max-w-[180px] sm:max-w-none">
            {exercise.targetMuscle}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <span>Cadenza:</span>
          <span className="font-bold text-white">3-0-1-0</span>
        </div>
      </div>
    </div>
  );
};
