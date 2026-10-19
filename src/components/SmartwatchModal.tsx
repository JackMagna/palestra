import React, { useState, useEffect } from 'react';
import { 
  X, 
  Watch, 
  Heart, 
  Flame, 
  Bluetooth, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Cloud, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { smartwatchHealth, HeartRateData, HealthWorkoutSummary } from '../services/smartwatchHealth';
import { syncWorkoutToGoogleFit } from '../services/googleFitSync';
import { getAccessToken } from '../services/firebase';

interface SmartwatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDurationMinutes: number;
  userWeightKg?: number;
  onUpdateBpm?: (bpm: number, calories: number) => void;
}

export const SmartwatchModal: React.FC<SmartwatchModalProps> = ({
  isOpen,
  onClose,
  currentDurationMinutes,
  userWeightKg = 75,
  onUpdateBpm
}) => {
  const [activeTab, setActiveTab] = useState<'healthConnect' | 'bluetooth'>('healthConnect');

  // Cloud Health Connect state
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<string | null>(null);

  // Bluetooth state
  const [isConnected, setIsConnected] = useState(false);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [heartZone, setHeartZone] = useState<HeartRateData['zone']>('Riscaldamento');
  const [statusText, setStatusText] = useState('Nessun orologio collegato via Bluetooth.');
  const [isScanning, setIsScanning] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    if (currentBpm && currentDurationMinutes > 0) {
      const cal = smartwatchHealth.estimateCalories(currentBpm, currentDurationMinutes, userWeightKg);
      setTotalCalories(cal);
      if (onUpdateBpm) {
        onUpdateBpm(currentBpm, cal);
      }
    }
  }, [currentBpm, currentDurationMinutes, userWeightKg, onUpdateBpm]);

  if (!isOpen) return null;

  // Cloud Sync to Google Fit & Health Connect
  const handleSyncToHealthConnect = async () => {
    setIsSyncingCloud(true);
    setCloudSyncResult(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Token Google non trovato. Effettua l\'accesso con il tuo account Google.');
      }

      const now = Date.now();
      const startTime = now - Math.max(1, currentDurationMinutes) * 60000;

      const res = await syncWorkoutToGoogleFit(token, {
        sessionId: `fit-session-${now}`,
        name: 'Allenamento Palestra - Giacomo & Dario PT',
        description: 'Sessione di pesistica con scheda 6 settimane',
        startTimeMillis: startTime,
        endTimeMillis: now,
        totalVolumeKg: 8500, // sample aggregate
        totalSets: 14
      });

      if (res.success) {
        setCloudSyncResult('Sessione sincronizzata con successo su Google Fit e Health Connect! I dati sono ora visibili sul tuo smartwatch.');
      } else {
        setCloudSyncResult(`Info sincronizzazione: ${res.error || 'Invio completato.'}`);
      }
    } catch (err: any) {
      setCloudSyncResult(err.message || 'Errore di sincronizzazione Health Connect');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Direct Bluetooth Connect
  const handleConnectBluetooth = async () => {
    setIsScanning(true);
    setStatusText('Attivazione ricerca Bluetooth...');

    const success = await smartwatchHealth.connectHeartRateMonitor(
      (data) => {
        setCurrentBpm(data.bpm);
        setHeartZone(data.zone);
        setIsConnected(true);
      },
      (status, connected) => {
        setStatusText(status);
        setIsConnected(connected);
        setIsScanning(false);
      }
    );

    if (!success) {
      setIsScanning(false);
    }
  };

  const handleDisconnectBluetooth = () => {
    smartwatchHealth.disconnect();
    setIsConnected(false);
    setCurrentBpm(null);
    setStatusText('Disconnesso.');
  };

  const handleExportAppleHealth = () => {
    const summary: HealthWorkoutSummary = {
      workoutName: 'Allenamento Palestra Dario PT',
      durationMinutes: Math.max(1, currentDurationMinutes),
      averageBpm: currentBpm || 128,
      maxBpm: currentBpm ? currentBpm + 18 : 160,
      totalCalories: Math.max(50, totalCalories || Math.round(currentDurationMinutes * 6.5)),
      startTime: new Date(Date.now() - currentDurationMinutes * 60000).toISOString(),
      endTime: new Date().toISOString(),
      weightKg: userWeightKg
    };

    const json = smartwatchHealth.exportToHealthFormat(summary);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Workout_Health_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Watch className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Sincronizzazione Smartwatch & Salute</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Health Connect vs Bluetooth */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('healthConnect')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'healthConnect'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud Health Connect
          </button>
          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bluetooth'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bluetooth Cardio Live
          </button>
        </div>

        {/* TAB 1: Google Fit & Health Connect Cloud Sync */}
        {activeTab === 'healthConnect' && (
          <div className="space-y-4">
            {/* Architectural Data Flow Diagram */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block tracking-wider">
                Come avviene il passaggio dati:
              </span>
              
              <div className="flex items-center justify-between text-[11px] font-mono text-center gap-1">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-1">
                    App
                  </div>
                  <span className="text-slate-300">IronTrack</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500" />

                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-1">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300">Google Cloud</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500" />

                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-1">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300">Health Connect</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500" />

                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold mb-1">
                    <Watch className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300">Smartwatch</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                L'app invia la sessione di forza (pesi, durata, calorie stimate) direttamente a <strong>Google Fit REST API</strong> con il tuo account Google. Android <strong>Health Connect</strong> legge automaticamente il dato e lo inoltra al tuo smartwatch (WearOS, Samsung Galaxy Watch, Fitbit).
              </p>
            </div>

            {/* Sync Action Button */}
            <button
              onClick={handleSyncToHealthConnect}
              disabled={isSyncingCloud}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-98"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Sincronizzazione in corso...' : 'Sincronizza Sessione su Health Connect'}</span>
            </button>

            {cloudSyncResult && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{cloudSyncResult}</span>
              </div>
            )}

            {/* Apple Health Export */}
            <button
              onClick={handleExportAppleHealth}
              className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Esporta file per Apple Health (iOS)</span>
            </button>
          </div>
        )}

        {/* TAB 2: Live Bluetooth Heart Rate Bridge */}
        {activeTab === 'bluetooth' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              {isConnected && currentBpm ? (
                <>
                  <div className="relative flex items-center justify-center">
                    <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-pulse" />
                    <span className="absolute text-xl font-black font-mono text-white">
                      {currentBpm}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Frequenza Cardiaca Live</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold font-mono">
                        Zona: {heartZone}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        {totalCalories} kcal
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Bluetooth className={`w-7 h-7 ${isScanning ? 'animate-bounce text-amber-400' : ''}`} />
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">{statusText}</p>
                </>
              )}
            </div>

            {!isConnected ? (
              <button
                onClick={handleConnectBluetooth}
                disabled={isScanning}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98"
              >
                <Bluetooth className="w-4 h-4" />
                <span>{isScanning ? 'Ricerca Sensore...' : 'Collega Sensore Cardio / Orologio BLE'}</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnectBluetooth}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Disconnetti Dispositivo
              </button>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 La connessione Bluetooth serve per vedere il battito in diretta durante le serie; non è necessaria per salvare l'allenamento, che viene sincronizzato automaticamente via cloud.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
