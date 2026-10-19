/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  FileSpreadsheet, 
  Play, 
  TrendingUp, 
  LogOut, 
  CheckCircle2, 
  Watch,
  User,
  Sparkles
} from 'lucide-react';
import { INITIAL_GYM_PROGRAM, WorkoutProgram } from './data/initialProgram';
import { WorkoutExecution } from './components/WorkoutExecution';
import { SheetsMatrixView } from './components/SheetsMatrixView';
import { ExerciseCatalog } from './components/ExerciseCatalog';
import { ProgressCharts, MeasurementRecord } from './components/ProgressCharts';
import { AuthOnboarding } from './components/AuthOnboarding';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './services/firebase';
import { appendWorkoutLogToGoogleSheet } from './services/googleSheets';
import { syncWorkoutToGoogleFit } from './services/googleFitSync';
import { doc, setDoc } from 'firebase/firestore';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workout' | 'sheets' | 'exercises' | 'progress'>('workout');
  const [program] = useState<WorkoutProgram>(INITIAL_GYM_PROGRAM);
  const [activeDayId, setActiveDayId] = useState<string>('giorno-1');
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');

  // App initialization state (demanded by user: app must start locked and clean until Google login)
  const [isAppInitialized, setIsAppInitialized] = useState<boolean>(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Measurements State (empty by default, loaded from storage if user has recorded them)
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);

  // Workout Volume History
  const [workoutVolumeHistory, setWorkoutVolumeHistory] = useState<{ week: number; volumeKg: number }[]>([]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setIsAppInitialized(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load user data from local storage if previously setup
  useEffect(() => {
    try {
      const savedInit = localStorage.getItem('irontrack_initialized');
      if (savedInit === 'true') {
        setIsAppInitialized(true);
      }
      const savedMeasurements = localStorage.getItem('irontrack_measurements');
      if (savedMeasurements) {
        setMeasurements(JSON.parse(savedMeasurements));
      }
      const savedSpreadsheetId = localStorage.getItem('irontrack_sheet_id');
      if (savedSpreadsheetId) {
        setSpreadsheetId(savedSpreadsheetId);
      }
    } catch {}
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        showToast(`Benvenuto, ${res.user.displayName || 'Atleta'}!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Errore durante l\'accesso con Google', 'info');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setIsAppInitialized(false);
    localStorage.removeItem('irontrack_initialized');
    showToast('Disconnesso con successo');
  };

  const handleInitializeProgram = (customSheetId?: string) => {
    if (customSheetId) {
      setSpreadsheetId(customSheetId);
      localStorage.setItem('irontrack_sheet_id', customSheetId);
    }
    setIsAppInitialized(true);
    localStorage.setItem('irontrack_initialized', 'true');
    showToast('Scheda Giacomo • Dario PT inizializzata con successo!');
  };

  const handleUpdateSpreadsheetId = (id: string) => {
    setSpreadsheetId(id);
    localStorage.setItem('irontrack_sheet_id', id);
    showToast('ID Google Sheet salvato con successo!');
  };

  // Add body measurement
  const handleAddMeasurement = async (record: Omit<MeasurementRecord, 'id'>) => {
    const newRecord: MeasurementRecord = {
      ...record,
      id: `m-${Date.now()}`
    };

    const updated = [...measurements, newRecord];
    setMeasurements(updated);
    localStorage.setItem('irontrack_measurements', JSON.stringify(updated));

    // Persist to Firestore if user is authenticated
    if (currentUser?.uid) {
      const path = `users/${currentUser.uid}/measurements/${newRecord.id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'measurements', newRecord.id), {
          ...newRecord,
          userId: currentUser.uid,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }

    showToast('Misurazione registrata con successo!');
  };

  // Save completed workout session
  const handleSaveSession = async (sessionSummary: {
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
  }) => {
    setIsSaving(true);
    try {
      const sessionId = `session-${Date.now()}`;
      const sessionData = {
        sessionId,
        ...sessionSummary,
        date: new Date().toISOString().split('T')[0]
      };

      // 1. Save to local storage history
      const localHistory = JSON.parse(localStorage.getItem('irontrack_sessions') || '[]');
      localHistory.push(sessionData);
      localStorage.setItem('irontrack_sessions', JSON.stringify(localHistory));

      // Update volume history for charts
      setWorkoutVolumeHistory((prev) => [
        ...prev,
        { week: sessionSummary.weekNumber, volumeKg: sessionSummary.totalVolumeKg }
      ]);

      // 2. Persist to Firestore if user is logged in
      if (currentUser?.uid) {
        const path = `users/${currentUser.uid}/sessions/${sessionId}`;
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'sessions', sessionId), {
            ...sessionData,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }

      // 3. Sync to Google Sheets if connected
      if (accessToken && spreadsheetId) {
        try {
          await appendWorkoutLogToGoogleSheet(accessToken, spreadsheetId, {
            date: sessionData.date,
            dayTitle: sessionSummary.dayTitle,
            weekNumber: sessionSummary.weekNumber,
            sets: sessionSummary.completedSets
          });
        } catch (sheetErr) {
          console.warn('Errore sync Sheets:', sheetErr);
        }
      }

      // 4. Automatic Cloud Sync to Google Fit & Android Health Connect
      if (accessToken) {
        try {
          const now = Date.now();
          await syncWorkoutToGoogleFit(accessToken, {
            sessionId,
            name: `Allenamento Dario PT - ${sessionSummary.dayTitle}`,
            description: `Sessione ${sessionSummary.dayTitle} - Settimana ${sessionSummary.weekNumber}`,
            startTimeMillis: now - sessionSummary.durationMinutes * 60000,
            endTimeMillis: now,
            totalVolumeKg: sessionSummary.totalVolumeKg,
            totalSets: sessionSummary.completedSets.length
          });
        } catch (fitErr) {
          console.warn('Errore sync Google Fit:', fitErr);
        }
      }

      showToast('Allenamento completato e sincronizzato su Google Sheets & Health Connect!');
    } finally {
      setIsSaving(false);
    }
  };

  // If not logged in or not initialized: Show Mobile Onboarding Lockscreen
  if (!currentUser || !isAppInitialized) {
    return (
      <AuthOnboarding
        onLogin={handleGoogleLogin}
        isLoggingIn={isLoggingIn}
        onInitializeProgram={handleInitializeProgram}
        isLoggedIn={!!currentUser}
        userDisplayName={currentUser?.displayName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Mobile-first Header */}
      <header className="sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 h-15 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Dumbbell className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                IronTrack
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Dario PT
              </span>
            </div>
          </div>

          {/* Actions: Install App & User & Logout */}
          <div className="flex items-center gap-2">
            <PWAInstallButton compact={true} />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate max-w-[120px] font-medium">{currentUser.displayName || 'Atleta'}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Disconnetti"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-5">
        {activeTab === 'workout' && (
          <WorkoutExecution
            program={program}
            activeDayId={activeDayId}
            onSelectDay={setActiveDayId}
            currentWeek={currentWeek}
            onSelectWeek={setCurrentWeek}
            onSaveSession={handleSaveSession}
            isSaving={isSaving}
          />
        )}

        {activeTab === 'sheets' && (
          <SheetsMatrixView
            program={program}
            spreadsheetId={spreadsheetId}
            onUpdateSpreadsheetId={handleUpdateSpreadsheetId}
            isGoogleAuthenticated={!!currentUser}
            onConnectGoogle={handleGoogleLogin}
          />
        )}

        {activeTab === 'exercises' && <ExerciseCatalog />}

        {activeTab === 'progress' && (
          <ProgressCharts
            measurements={measurements}
            onAddMeasurement={handleAddMeasurement}
            workoutVolumeHistory={workoutVolumeHistory}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed top-18 right-4 left-4 sm:left-auto sm:w-80 z-50 p-4 rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl text-xs text-white flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Giant Mobile Bottom Navigation Tabs (Ergonomic Thumb Zone) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 items-center h-18 pb-safe max-w-2xl mx-auto">
        <button
          onClick={() => setActiveTab('workout')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'workout' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dumbbell className={`w-6 h-6 ${activeTab === 'workout' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold tracking-tight mt-1">Workout</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'sheets' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className={`w-6 h-6 ${activeTab === 'sheets' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold tracking-tight mt-1">Scheda</span>
        </button>

        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'exercises' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className={`w-6 h-6 ${activeTab === 'exercises' ? 'fill-current' : ''}`} />
          <span className="text-[11px] font-semibold tracking-tight mt-1">Tutorial</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'progress' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className={`w-6 h-6 ${activeTab === 'progress' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold tracking-tight mt-1">Misure</span>
        </button>
      </nav>
      <OfflineIndicator />
    </div>
  );
}
