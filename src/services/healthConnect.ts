import { Capacitor } from '@capacitor/core';
import type { HealthSample } from '@capgo/capacitor-health';
import type { WorkoutSession } from '../types';
import { isoDay, mergeBody, summarizeHeartRate, type BodyEntry } from '../lib/fitbitMath';
import { readJSON, writeJSON } from '../lib/storage';
import { notifyHealth } from './health';

/**
 * Health Connect (Android): funziona solo dentro l'app Android, non dal sito.
 * Il plugin viene caricato solo quando serve, così la versione web non lo scarica.
 */
const KEY = 'irontrack:hc-connected';
const READ = ['weight', 'bodyFat', 'heartRate'] as const;
const WRITE = ['weight', 'bodyFat'] as const;

export function isAndroidApp(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

const plugin = async () => (await import('@capgo/capacitor-health')).Health;

export const isHealthConnectConnected = () => isAndroidApp() && readJSON<boolean>(KEY, false);

export async function connectHealthConnect(): Promise<void> {
  if (!isAndroidApp()) throw new Error('Health Connect è disponibile solo nell\'app Android, non dal sito.');
  const Health = await plugin();
  const availability = await Health.isAvailable();
  if (!availability.available) {
    throw new Error(availability.reason ?? 'Health Connect non è disponibile. Installalo dal Play Store (“Health Connect by Android”).');
  }
  const status = await Health.requestAuthorization({ read: [...READ], write: [...WRITE] });
  if (!status.readAuthorized.includes('weight') && !status.readAuthorized.includes('heartRate')) {
    throw new Error('Non hai concesso nessun permesso di lettura. Riprova e consenti l\'accesso a peso e frequenza cardiaca.');
  }
  writeJSON(KEY, true);
  notifyHealth();
}

export function disconnectHealthConnect() {
  // i permessi si revocano dalle impostazioni di Health Connect: qui si smette solo di usarli
  writeJSON(KEY, false);
  notifyHealth();
}

export async function openHealthConnectSettings() {
  await (await plugin()).openHealthConnectSettings();
}

/* ---------- conversioni (testate senza telefono) ---------- */
type Sample = Pick<HealthSample, 'value' | 'startDate'>;

export function samplesToBody(weights: Sample[], fats: Sample[]): BodyEntry[] {
  const day = (s: Sample) => isoDay(Date.parse(s.startDate));
  const byTime = (a: Sample, b: Sample) => Date.parse(a.startDate) - Date.parse(b.startDate);
  return mergeBody(
    [...weights].sort(byTime).map((s) => ({ date: day(s), weight: s.value })),
    [...fats].sort(byTime).map((s) => ({ date: day(s), fat: s.value }))
  );
}

export function samplesToHeartRate(samples: Sample[]): { avg: number; max: number } | null {
  return summarizeHeartRate(samples.map((s) => ({ time: s.startDate, value: s.value })));
}

/* ---------- operazioni ---------- */
const range = (from: number, to: number) => ({ startDate: new Date(from).toISOString(), endDate: new Date(to).toISOString() });

export async function readBody(days = 30): Promise<BodyEntry[]> {
  const Health = await plugin();
  const q = range(Date.now() - days * 86_400_000, Date.now());
  const [w, f] = await Promise.all([
    Health.readSamples({ dataType: 'weight', ...q, limit: 200 }),
    Health.readSamples({ dataType: 'bodyFat', ...q, limit: 200 }).catch(() => ({ samples: [] as HealthSample[] }))
  ]);
  return samplesToBody(w.samples, f.samples);
}

export async function readHeartRate(session: WorkoutSession): Promise<{ avg: number; max: number } | null> {
  const Health = await plugin();
  const { samples } = await Health.readSamples({ dataType: 'heartRate', ...range(session.startedAt, session.endedAt), limit: 2000 });
  return samplesToHeartRate(samples);
}

/** Salva peso e massa grassa alla data della misura (mezzogiorno locale). */
export async function writeBody(entry: BodyEntry): Promise<void> {
  const Health = await plugin();
  const startDate = new Date(`${entry.date}T12:00:00`).toISOString();
  if (entry.weightKg !== undefined) await Health.saveSample({ dataType: 'weight', value: entry.weightKg, startDate });
  if (entry.bodyFat !== undefined) await Health.saveSample({ dataType: 'bodyFat', value: entry.bodyFat, startDate });
}
