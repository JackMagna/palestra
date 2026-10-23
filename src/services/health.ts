import { readJSON, writeJSON } from '../lib/storage';

/** Da dove arrivano (e dove vanno) peso, massa grassa e frequenza cardiaca. Una sola fonte per volta. */
export type HealthSource = 'none' | 'fitbit' | 'healthconnect';

const KEY = 'irontrack:health-source';
const listeners = new Set<() => void>();

export const subscribeHealth = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
export const notifyHealth = () => listeners.forEach((l) => l());

export function getHealthSource(): HealthSource {
  const v = readJSON<string>(KEY, 'none');
  return v === 'fitbit' || v === 'healthconnect' ? v : 'none';
}
export function setHealthSource(source: HealthSource) {
  writeJSON(KEY, source);
  notifyHealth();
}
export const SOURCE_LABEL: Record<HealthSource, string> = { none: 'Nessuna', fitbit: 'Fitbit', healthconnect: 'Health Connect' };
