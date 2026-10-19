import React, { useState } from 'react';
import { Dumbbell, ShieldCheck, FileSpreadsheet, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthOnboardingProps {
  onLogin: () => Promise<void>;
  isLoggingIn: boolean;
  onInitializeProgram: (spreadsheetId?: string) => void;
  isLoggedIn: boolean;
  userDisplayName?: string;
}

export const AuthOnboarding: React.FC<AuthOnboardingProps> = ({
  onLogin,
  isLoggingIn,
  onInitializeProgram,
  isLoggedIn,
  userDisplayName
}) => {
  const [sheetInput, setSheetInput] = useState('');
  const [setupStep, setSetupStep] = useState<'login' | 'sheetSetup'>(isLoggedIn ? 'sheetSetup' : 'login');

  const handleStartWithDefaultProgram = () => {
    onInitializeProgram();
  };

  const handleStartWithCustomSheet = () => {
    let cleanId = sheetInput.trim();
    if (cleanId.includes('/spreadsheets/d/')) {
      const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }
    }
    onInitializeProgram(cleanId || undefined);
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center p-4 sm:p-6 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
          <Dumbbell className="w-8 h-8 stroke-[2.5]" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            IronTrack
          </h1>
          <p className="text-xs uppercase tracking-wider font-semibold text-amber-400 mt-1">
            Programma Giacomo • Dario Personal Trainer
          </p>
        </div>

        {!isLoggedIn ? (
          /* Step 1: Login Required */
          <div className="space-y-5">
            <p className="text-xs text-slate-300 leading-relaxed text-left">
              Per garantire la sincronizzazione in tempo reale dei tuoi carichi senza variare la formattazione della scheda condivisa dal trainer, è necessario autenticarsi con il tuo account Google.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-left text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Accesso bidirezionale a Google Drive e Sheets</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tracciamento carichi a tutto schermo (Mobile-First)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mini-clip video ExerciseDB direttamente in app</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Collegamento orologi e cardiofrequenzimetri Bluetooth</span>
              </div>
            </div>

            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-98"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Connessione a Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Accedi con Google per iniziare</span>
                </>
              )}
            </button>

              {/* Direct Instant Access Button */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleStartWithDefaultProgram}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/30 hover:border-amber-400 transition-all active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Apri Subito Scheda Giacomo • Dario PT (Accesso Rapido)</span>
              </button>

              <PWAInstallButton />
              
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Puoi collegare Google Drive & Sheets in qualsiasi momento dalle impostazioni
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Google Account Connected -> Choose / Link Sheet */
          <div className="space-y-5 text-left">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Account Google Connesso</p>
                <p className="text-[11px] text-slate-300">{userDisplayName || 'Utente'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Seleziona il Foglio di Allenamento:
              </h3>

              {/* Option A: Official 6-Week Dario PT Routine */}
              <button
                onClick={handleStartWithDefaultProgram}
                className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Opzione Consigliata</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm font-bold text-white mt-1">Scheda Giacomo • Dario PT (6 Settimane)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Giorno 1 & 2 con progressione pesi bisettimanale, serie a cedimento e note tecniche preimpostate.
                </p>
              </button>

              {/* Option B: Link existing Google Sheet URL/ID */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300">Oppure collega un foglio Google esistente:</span>
                <input
                  type="text"
                  placeholder="Incolla link o ID del foglio Google..."
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleStartWithCustomSheet}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                >
                  Collega e Apri Allenamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
