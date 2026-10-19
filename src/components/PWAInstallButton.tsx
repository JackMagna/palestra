import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA / installed app, suppress the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={compact
          ? "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          : "flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-98"
        }
      >
        <Smartphone className="w-4 h-4" />
        <span>Installa App (APK / PWA)</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={compact
            ? "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs transition-all"
            : "flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-bold text-amber-400 transition-all"
          }
        >
          <Smartphone className="w-4 h-4" />
          <span>Installa su iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Smartphone className="w-5 h-5" />
                  <span>Installa su iOS (iPhone/iPad)</span>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p>
                    Tocca il tasto <strong>Condividi</strong> (<Share className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" />) nella barra in basso di Safari.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p>
                    Scorri le opzioni e tocca <strong>Aggiungi alla schermata Home</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400">
                    L'app verrà installata a tutto schermo senza barre del browser e funzionerà anche offline!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic fallback if ambient install prompt is available or user wants to install
  return (
    <button
      onClick={() => {
        alert("Per installare l'app su Android/Desktop: premi 'Aggiungi a schermata Home' dal menu del browser (3 puntini in alto a destra).");
      }}
      className={compact
        ? "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
        : "flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all"
      }
      title="Installa l'app sul dispositivo"
    >
      <Download className="w-3.5 h-3.5 text-amber-400" />
      <span>Installa App</span>
    </button>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-500/90 text-slate-950 backdrop-blur-md px-4 py-2.5 text-xs font-bold shadow-2xl border border-amber-300">
      <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
      <span>Modalità Offline: I tuoi dati e la scheda sono salvati sul dispositivo.</span>
    </div>
  );
};
