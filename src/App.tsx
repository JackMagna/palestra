import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { authErrorMessage, logout, signInWithGoogle, watchAuth } from './services/firebase';
import { useAppData } from './hooks/useAppData';
import { useSheetsSync } from './hooks/useSheetsSync';
import { useHealthSync } from './hooks/useHealthSync';
import { completeFitbitRedirect, getPrefs, isFitbitConnected } from './services/fitbit';
import { getHealthSource } from './services/health';
import { readJSON, removeKey, writeJSON } from './lib/storage';
import { AppShell, type Tab } from './components/layout/AppShell';
import { AccountSheet } from './components/layout/AccountSheet';
import { Welcome } from './components/onboarding/Welcome';
import { WorkoutScreen } from './components/workout/WorkoutScreen';
import { ProgramScreen } from './components/program/ProgramScreen';
import { LibraryScreen } from './components/exercise/LibraryScreen';
import { ProgressScreen } from './components/progress/ProgressScreen';
import { useToast } from './components/ui/Toast';
import { Logo } from './components/layout/Logo';
import { ErrorBoundary } from './components/ErrorBoundary';

const GUEST_KEY = 'irontrack:guest';

export default function App() {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(() => readJSON<boolean>(GUEST_KEY, false) || readJSON<unknown>('irontrack_initialized', null) === true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>('workout');
  const [accountOpen, setAccountOpen] = useState(false);
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const [editProgram, setEditProgram] = useState(false);
  const [data, actions] = useAppData(user, (msg) => toast(msg, 'error'));

  // Attenzione: in Chrome recenti scrollTo restituisce una Promise. Se l'effetto la restituisce,
  // React la tratta come funzione di pulizia e va in crash al cambio di sezione. Serve il blocco { }.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  const notify = (message: string, kind: 'success' | 'error' = 'success') => toast(message, kind);
  const sync = useSheetsSync({ user, spreadsheetId: data.spreadsheetId, program: data.program, sessions: data.sessions, measurements: data.measurements, actions, notify });
  const health = useHealthSync({ sessions: data.sessions, measurements: data.measurements, actions, hasSheet: !!data.spreadsheetId, notify });

  // ritorno dal login di Fitbit
  useEffect(() => {
    completeFitbitRedirect()
      .then((r) => {
        if (r === 'connected') toast('Fitbit collegato');
        if (r === 'denied') toast('Collegamento a Fitbit annullato.', 'error');
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Collegamento a Fitbit non riuscito', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = watchAuth((u) => { setUser(u); setAuthReady(true); });
    return unsubscribe;
  }, []);

  // Se Google o Firestore sono lenti o bloccati dalla rete, l'app parte comunque dopo qualche secondo.
  useEffect(() => {
    const t = setTimeout(() => setWaitedTooLong(true), 5000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (waitedTooLong && user && !data.ready) toast('Connessione lenta: i dati si aggiorneranno appena Firestore risponde.', 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitedTooLong]);

  const login = async () => {
    setLoggingIn(true);
    try {
      const u = await signInWithGoogle();
      toast(`Ciao ${u.displayName?.split(' ')[0] ?? ''}`.trim());
      setAccountOpen(false);
    } catch (err) {
      const msg = authErrorMessage(err);
      if (msg !== 'Accesso annullato.') toast(msg, 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const startGuest = () => {
    writeJSON(GUEST_KEY, true);
    setGuest(true);
  };

  const signOut = async () => {
    await logout();
    removeKey(GUEST_KEY);
    setGuest(false);
    setAccountOpen(false);
    setTab('workout');
  };

  const importBackup = async (raw: unknown) => {
    const b = raw as { app?: string; program?: unknown } | null;
    if (!b || b.app !== 'irontrack' || !b.program) {
      toast('Questo file non è un backup di IronTrack.', 'error');
      return;
    }
    if (!window.confirm('Importare il backup? Scheda, allenamenti e misure del file verranno aggiunti o sostituiti.')) return;
    try {
      await actions.importAll(b as never);
      toast('Backup importato');
      setAccountOpen(false);
    } catch (err) {
      toast(`Importazione non riuscita: ${err instanceof Error ? err.message : ''}`, 'error');
    }
  };

  if (!waitedTooLong && (!authReady || (user && !data.ready))) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <Logo className="h-12 w-12 animate-pulse" />
        <span className="sr-only">Caricamento</span>
      </div>
    );
  }

  if (!user && !guest) return <Welcome onLogin={login} onGuest={startGuest} busy={loggingIn} />;

  const accountLabel = user ? (user.displayName?.split(' ')[0] ?? 'Account') : 'Senza account';

  return (
    <AppShell tab={tab} onTab={setTab} accountLabel={accountLabel} onAccount={() => setAccountOpen(true)}>
      {/* L'allenamento resta montato: timer e sensore cardio non si interrompono cambiando sezione */}
      <div hidden={tab !== 'workout'}>
        <ErrorBoundary inline resetKey={tab}>
        <WorkoutScreen
          program={data.program}
          sessions={data.sessions}
          onFinish={(s) => {
            actions.addSession({
              ...s,
              sheetsSynced: data.spreadsheetId ? false : undefined,
              fitbitSynced: getHealthSource() === 'fitbit' && isFitbitConnected() && getPrefs().autoLog ? false : undefined
            });
            toast(`Allenamento salvato: ${s.sets.length} serie`);
          }}
          onEditProgram={() => { setEditProgram(true); setTab('program'); }}
        />
        </ErrorBoundary>
      </div>
      {tab === 'program' && (
        <ErrorBoundary inline resetKey={tab}>
        <ProgramScreen
          user={user}
          program={data.program}
          spreadsheetId={data.spreadsheetId}
          onSaveProgram={actions.saveProgram}
          onSetSpreadsheetId={actions.setSpreadsheetId}
          sync={sync}
          onLogin={login}
          startEditing={editProgram}
          onEditingConsumed={() => setEditProgram(false)}
        />
        </ErrorBoundary>
      )}
      {tab === 'library' && <ErrorBoundary inline resetKey={tab}><LibraryScreen /></ErrorBoundary>}
      {tab === 'progress' && (
        <ErrorBoundary inline resetKey={tab}>
        <ProgressScreen
          program={data.program}
          sessions={data.sessions}
          measurements={data.measurements}
          onAddMeasurement={(m) => {
            actions.addMeasurement({ ...m, sheetsSynced: data.spreadsheetId ? false : undefined, healthSynced: getHealthSource() !== 'none' ? false : undefined });
            toast('Misura salvata');
          }}
          onDeleteMeasurement={actions.deleteMeasurement}
          onDeleteSession={actions.deleteSession}
          onStartWorkout={() => setTab('workout')}
          health={health}
          loggedIn={!!user}
          sheetConnected={!!data.spreadsheetId}
          pendingMeasures={data.measurements.filter((m) => m.sheetsSynced === false).length}
          measuresState={sync.measures}
          onSyncMeasures={sync.syncMeasures}
          onResolveMeasure={sync.resolveConflict}
        />
        </ErrorBoundary>
      )}
      <AccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        user={user}
        data={data}
        onLogin={login}
        onLogout={signOut}
        onImport={importBackup}
        health={health}
      />
    </AppShell>
  );
}
