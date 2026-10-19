import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Minus, Volume2, BellRing } from 'lucide-react';
import { sound } from '../utils/sound';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds = 120,
  isOpen,
  onClose,
  exerciseName
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  // Sync when initialSeconds changes
  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setSecondsLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          sound.playTimerDone();
          // Haptic feedback on mobile if supported
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([300, 150, 300, 150, 500]);
            } catch {}
          }
          return 0;
        }

        // Warning ticks for the last 3 seconds
        if (prev <= 4 && prev > 1) {
          sound.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSecs = secondsLeft % 60;
  const formattedTime = `${minutes}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 100;
  const isFinished = secondsLeft === 0;

  const adjustTime = (delta: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + delta));
    setTotalSeconds((prev) => Math.max(prev, prev + delta));
  };

  const restart = () => {
    setSecondsLeft(totalSeconds);
    setIsRunning(true);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-bottom duration-200">
      <div className={`p-4 rounded-2xl shadow-2xl border transition-all ${
        isFinished 
          ? 'bg-amber-500/20 border-amber-500 backdrop-blur-xl' 
          : 'bg-slate-900/95 border-slate-700/80 backdrop-blur-xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BellRing className={`w-4 h-4 ${isFinished ? 'text-amber-400 animate-bounce' : 'text-amber-500'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {isFinished ? 'Recupero Completato!' : 'Timer Recupero'}
            </span>
          </div>
          {exerciseName && (
            <span className="text-xs text-slate-400 truncate max-w-[150px]">
              {exerciseName}
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Chiudi timer"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timer Display & Circular Bar */}
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex flex-col">
            <span className={`text-4xl font-extrabold font-mono tracking-tight tabular-nums ${
              isFinished ? 'text-amber-400 animate-pulse' : 'text-white'
            }`}>
              {formattedTime}
            </span>
            <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isFinished ? 'bg-amber-400' : 'bg-amber-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Adjustment Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => adjustTime(-15)}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
              title="-15 secondi"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => adjustTime(30)}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all text-xs font-mono font-bold"
              title="+30 secondi"
            >
              +30s
            </button>
            {isFinished ? (
              <button
                onClick={restart}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ripeti
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                title={isRunning ? 'Pausa' : 'Avvia'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            )}
          </div>
        </div>

        {/* Motivational cue */}
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Riposa e idratati tra le serie</span>
          <span className="text-amber-400/80">Obiettivo: 2 min</span>
        </div>
      </div>
    </div>
  );
};
