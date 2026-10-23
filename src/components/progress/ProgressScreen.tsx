import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, Plus, Trash2 } from 'lucide-react';
import type { Measurement, WorkoutProgram, WorkoutSession } from '../../types';
import { exerciseTrend, personalBest, sessionsThisWeek } from '../../lib/stats';
import { formatDate, formatKg } from '../../lib/ids';
import { sessionToTCX } from '../../lib/tcx';
import { downloadText } from '../../lib/download';
import { LineChart } from './LineChart';
import { MeasurementForm } from './MeasurementForm';
import { MeasuresSyncBar } from './MeasuresSyncBar';
import type { MeasuresState } from '../../hooks/useSheetsSync';
import type { MeasureConflict } from '../../lib/measuresSheet';
import { inferStartDate, weekOfDate } from '../../lib/measuresSheet';
import { Button, IconButton } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { EmptyState } from '../ui/EmptyState';
import { Segmented } from '../ui/Segmented';
import type { HealthApi } from '../../hooks/useHealthSync';

interface Props {
  program: WorkoutProgram;
  sessions: WorkoutSession[];
  measurements: Measurement[];
  onAddMeasurement: (m: Measurement) => void;
  onDeleteMeasurement: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onStartWorkout: () => void;
  health: HealthApi;
  loggedIn: boolean;
  sheetConnected: boolean;
  pendingMeasures: number;
  measuresState: MeasuresState;
  onSyncMeasures: (interactive: boolean) => void;
  onResolveMeasure: (c: MeasureConflict, choice: 'sheet' | 'app') => void;
}

export function ProgressScreen({ program, sessions, measurements, onAddMeasurement, onDeleteMeasurement, onDeleteSession, onStartWorkout, health, loggedIn, sheetConnected, pendingMeasures, measuresState, onSyncMeasures, onResolveMeasure }: Props) {
  const [view, setView] = useState<'training' | 'body'>('training');
  const [formOpen, setFormOpen] = useState(false);
  const [openSession, setOpenSession] = useState<string | null>(null);

  const exercises = useMemo(() => program.days.flatMap((d) => d.exercises.map((e) => ({ ...e, dayTitle: d.title }))), [program]);
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '');
  const selected = exercises.find((e) => e.id === exerciseId) ?? exercises[0];

  const chrono = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  const volumeData = chrono.map((s) => ({ date: s.date, value: s.totalVolumeKg }));
  const trend = selected ? exerciseTrend(sessions, selected.id, selected.name) : [];
  const best = selected ? personalBest(sessions, selected.id, selected.name) : null;
  const withWeight = measurements.filter((m) => m.weightKg !== undefined);
  const latest = withWeight[withWeight.length - 1];
  const previous = withWeight[withWeight.length - 2];
  const startDate = inferStartDate(program, sessions);
  const currentWeek = Math.min(program.totalWeeks, Math.max(1, weekOfDate(startDate, new Date().toISOString().slice(0, 10), program.totalWeeks)));
  const latestAny = measurements[measurements.length - 1];

  // aprendo le misure si ricontrolla il foglio (senza popup)
  useEffect(() => {
    if (view === 'body') onSyncMeasures(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Progressi</h1>
        <Segmented label="Sezione" value={view} onChange={setView} options={[{ value: 'training', label: 'Allenamenti' }, { value: 'body', label: 'Misure' }]} />
      </header>

      {view === 'training' && (
        sessions.length === 0 ? (
          <EmptyState title="Nessun allenamento salvato" action={<Button variant="primary" onClick={onStartWorkout}>Inizia un allenamento</Button>}>
            Quando concludi un allenamento, qui trovi volume, record e lo storico delle serie.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            <dl className="grid grid-cols-3 gap-3">
              {[
                ['Allenamenti', String(sessions.length)],
                ['Ultimi 7 giorni', String(sessionsThisWeek(sessions))],
                ['Ultimo', formatDate(sessions[0].date)]
              ].map(([k, v]) => (
                <div key={k} className="card p-3 sm:p-4">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums sm:text-3xl">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card min-w-0 p-4">
                <h2 className="font-display text-xl font-semibold">Volume per allenamento</h2>
                <p className="mb-3 text-sm text-muted">Somma di peso × ripetizioni, in kg.</p>
                <LineChart data={volumeData} unit="kg" label="Volume per allenamento" />
              </section>

              <section className="card min-w-0 p-4">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-semibold">Andamento esercizio</h2>
                    <p className="text-sm text-muted">Massimale stimato sulla serie migliore.</p>
                  </div>
                  <label>
                    <span className="sr-only">Esercizio</span>
                    <select className="field max-w-[16rem]" value={selected?.id ?? ''} onChange={(e) => setExerciseId(e.target.value)}>
                      {program.days.map((d) => (
                        <optgroup key={d.id} label={d.title}>
                          {d.exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </div>
                {best && (
                  <p className="mb-2 text-[15px]">
                    Record: <strong className="tabular-nums">{formatKg(best.weightKg)} kg × {best.reps}</strong>
                    <span className="text-muted"> il {formatDate(best.date, { day: 'numeric', month: 'long' })}, massimale stimato {formatKg(best.oneRepMax)} kg</span>
                  </p>
                )}
                <LineChart data={trend} unit="kg" label={`Andamento ${selected?.name ?? ''}`} />
              </section>
            </div>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">Storico</h2>
              <ul className="space-y-2">
                {sessions.map((s) => {
                  const open = openSession === s.id;
                  const byExercise = groupSets(s);
                  return (
                    <li key={s.id} className="card">
                      <button type="button" onClick={() => setOpenSession(open ? null : s.id)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{formatDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {s.dayTitle}</p>
                          <p className="text-sm text-muted">
                            Settimana {s.weekNumber} · {s.sets.length} serie · {formatKg(s.totalVolumeKg)} kg · {s.durationMinutes} min
                            {s.avgBpm ? ` · ${s.avgBpm} bpm medi` : ''}{s.fitbitSynced ? ' · su Fitbit' : ''}
                          </p>
                        </div>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
                      </button>
                      {open && (
                        <div className="space-y-3 border-t border-line p-4">
                          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                            {byExercise.map(([name, sets]) => (
                              <li key={name}>
                                <p className="font-medium">{name}</p>
                                <p className="text-sm tabular-nums text-muted">{sets.map((x) => `${formatKg(x.weightKg)}×${x.reps}`).join('  ')}</p>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={() => downloadText(`allenamento-${s.date}.tcx`, sessionToTCX(s), 'application/vnd.garmin.tcx+xml')}>
                              Esporta TCX (Strava, Garmin)
                            </Button>
                            {health.source === 'fitbit' && health.connected && s.fitbitSynced !== true && (
                              <Button size="sm" disabled={health.busy} onClick={() => health.syncSession(s)}>Registra su Fitbit</Button>
                            )}
                            {health.connected && !s.avgBpm && (
                              <Button size="sm" disabled={health.busy} onClick={() => health.importHeartRate(s)}>Importa frequenza</Button>
                            )}
                            <Button size="sm" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => window.confirm('Eliminare questo allenamento?') && onDeleteSession(s.id)}>
                              Elimina
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )
      )}

      {view === 'body' && (
        <div className="space-y-6">
          <MeasuresSyncBar connected={sheetConnected} loggedIn={loggedIn} pending={pendingMeasures} state={measuresState} onSync={onSyncMeasures} onResolve={onResolveMeasure} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {latest ? (
              <p className="text-[15px]">
                Ultima pesata: <strong className="tabular-nums">{formatKg(latest.weightKg!)} kg</strong>
                {previous && <span className="text-muted"> ({latest.weightKg! - previous.weightKg! >= 0 ? '+' : ''}{formatKg(latest.weightKg! - previous.weightKg!)} kg dalla precedente)</span>}
              </p>
            ) : <span />}
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>Nuova misura</Button>
          </div>

          {measurements.length === 0 ? (
            <EmptyState title="Nessuna misura">Registra peso e circonferenze ogni due settimane, alla stessa ora, per vedere come cambi.</EmptyState>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card min-w-0 p-4">
                <h2 className="mb-3 font-display text-xl font-semibold">Peso corporeo</h2>
                <LineChart data={withWeight.map((m) => ({ date: m.date, value: m.weightKg! }))} unit="kg" label="Peso corporeo" />
              </section>
              <section className="card min-w-0 overflow-x-auto p-4">
                <h2 className="mb-3 font-display text-xl font-semibold">Tutte le misure</h2>
                <table className="w-full min-w-[36rem] text-left text-[15px]">
                  <thead className="text-sm text-muted">
                    <tr>
                      {['Sett.', 'Data', 'Peso', 'Vita', 'Addome', 'Fianchi', 'Braccio', 'Coscia', ''].map((h) => <th key={h} scope="col" className="pb-2 pr-3 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {[...measurements].reverse().map((m) => (
                      <tr key={m.id} className="border-t border-line/60">
                        <td className="py-2 pr-3">{m.week ?? weekOfDate(startDate, m.date, program.totalWeeks)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{formatDate(m.date)}</td>
                        <td className="py-2 pr-3">{m.weightKg !== undefined ? formatKg(m.weightKg) : '–'}</td>
                        <td className="py-2 pr-3">{cm(m.waistCm)}</td>
                        <td className="py-2 pr-3">{cm(m.abdomenCm)}</td>
                        <td className="py-2 pr-3">{cm(m.hipsCm)}</td>
                        <td className="py-2 pr-3">{cm(m.armsCm)}</td>
                        <td className="py-2 pr-3">{cm(m.thighsCm)}</td>
                        <td className="py-1 text-right">
                          <IconButton label="Elimina misura" onClick={() => window.confirm('Eliminare questa misura?') && onDeleteMeasurement(m.id)}><Trash2 className="h-4 w-4" /></IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}
        </div>
      )}

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="Nuova misura">
        <MeasurementForm latest={latestAny} totalWeeks={program.totalWeeks} currentWeek={currentWeek} startDate={startDate} onCancel={() => setFormOpen(false)} onSave={(m) => { onAddMeasurement(m); setFormOpen(false); }} />
      </Sheet>
    </div>
  );
}

const cm = (v?: number) => (v === undefined ? '–' : formatKg(v));

function groupSets(s: WorkoutSession) {
  const map = new Map<string, WorkoutSession['sets']>();
  for (const set of s.sets) map.set(set.exerciseName, [...(map.get(set.exerciseName) ?? []), set]);
  return [...map.entries()];
}
