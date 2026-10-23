import type { WorkoutSession } from '../types';
import { challengeFor, randomString } from '../lib/pkce';
import { clock, estimateCalories, isoDay, mergeBody, summarizeHeartRate, type BodyEntry } from '../lib/fitbitMath';
import { readJSON, removeKey, writeJSON } from '../lib/storage';

/**
 * Collegamento a Fitbit Web API (OAuth 2.0 con PKCE, senza segreto nel browser).
 * Tutto il codice Fitbit sta in questo file, così si può sostituire in blocco
 * se Google sposta le API di Fitbit su Google Health API.
 */
const CLIENT_ID = (import.meta.env.VITE_FITBIT_CLIENT_ID as string | undefined)?.trim();
const SCOPES = 'activity heartrate weight';
const AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const API = 'https://api.fitbit.com';

const TOKEN_KEY = 'irontrack:fitbit-token';
const PKCE_KEY = 'irontrack:fitbit-pkce';
const PREFS_KEY = 'irontrack:fitbit-prefs';

interface Token { access: string; refresh: string; expiresAt: number; userId: string; scope: string }
export interface FitbitPrefs { autoLog: boolean }

export class FitbitAuthError extends Error {
  constructor(message = 'Il collegamento con Fitbit è scaduto. Ricollegalo dalle impostazioni.') {
    super(message);
    this.name = 'FitbitAuthError';
  }
}

export const isFitbitConfigured = () => !!CLIENT_ID;
export const redirectUri = () => `${window.location.origin}/`;

/* ---------- stato osservabile (per React) ---------- */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
export const subscribeFitbit = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const readToken = () => readJSON<Token | null>(TOKEN_KEY, null);
let snapshot = !!readToken();
export const isFitbitConnected = () => snapshot;
function setConnected() {
  const next = !!readToken();
  if (next !== snapshot) { snapshot = next; notify(); }
}

export const getPrefs = (): FitbitPrefs => ({ autoLog: true, ...readJSON<Partial<FitbitPrefs>>(PREFS_KEY, {}) });
export function setPrefs(p: Partial<FitbitPrefs>) {
  writeJSON(PREFS_KEY, { ...getPrefs(), ...p });
  notify();
}

/* ---------- login ---------- */
export async function startFitbitLogin() {
  if (!CLIENT_ID) throw new Error('Manca VITE_FITBIT_CLIENT_ID: vedi le istruzioni nelle impostazioni.');
  const verifier = randomString();
  const state = randomString(16);
  writeJSON(PKCE_KEY, { verifier, state });
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: redirectUri(),
    code_challenge: await challengeFor(verifier),
    code_challenge_method: 'S256',
    state
  });
  window.location.assign(`${AUTH_URL}?${params}`);
}

async function tokenRequest(body: Record<string, string>): Promise<Token> {
  const res = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID ?? '', ...body })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    const reason = json?.errors?.[0]?.message ?? res.statusText;
    if (res.status === 400 || res.status === 401) throw new FitbitAuthError(`Fitbit ha rifiutato il collegamento: ${reason}`);
    throw new Error(`Errore Fitbit (${res.status}): ${reason}`);
  }
  return {
    access: json.access_token,
    refresh: json.refresh_token,
    expiresAt: Date.now() + (Number(json.expires_in) || 28800) * 1000,
    userId: String(json.user_id ?? ''),
    scope: String(json.scope ?? '')
  };
}

let redirectJob: Promise<'connected' | 'denied' | null> | null = null;

/** Da chiamare all'avvio: se la pagina è il ritorno da Fitbit, completa il collegamento. */
export function completeFitbitRedirect(): Promise<'connected' | 'denied' | null> {
  redirectJob ??= (async () => {
    const q = new URLSearchParams(window.location.search);
    const code = q.get('code');
    const state = q.get('state');
    const error = q.get('error');
    const saved = readJSON<{ verifier: string; state: string } | null>(PKCE_KEY, null);
    if (!saved || !state || state !== saved.state || (!code && !error)) return null;
    window.history.replaceState({}, '', window.location.pathname);
    removeKey(PKCE_KEY);
    if (error || !code) return 'denied';
    const token = await tokenRequest({ grant_type: 'authorization_code', code, code_verifier: saved.verifier, redirect_uri: redirectUri() });
    writeJSON(TOKEN_KEY, token);
    setConnected();
    return 'connected';
  })();
  return redirectJob;
}

export function disconnectFitbit() {
  removeKey(TOKEN_KEY);
  setConnected();
}

let refreshing: Promise<Token> | null = null;

async function accessToken(force = false): Promise<string> {
  const t = readToken();
  if (!t) throw new FitbitAuthError('Fitbit non è collegato.');
  if (!force && t.expiresAt - 60_000 > Date.now()) return t.access;
  // il refresh token di Fitbit si usa una volta sola: serve una sola richiesta alla volta
  refreshing ??= tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh })
    .then((next) => { writeJSON(TOKEN_KEY, next); return next; })
    .catch((err) => { if (err instanceof FitbitAuthError) disconnectFitbit(); throw err; })
    .finally(() => { refreshing = null; });
  return (await refreshing).access;
}

async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Accept-Language': 'it_IT', ...(init.headers ?? {}) }
  });
  if (res.status === 401 && retry) {
    await accessToken(true);
    return api<T>(path, init, false);
  }
  if (res.status === 403) throw new Error('Fitbit non ha dato accesso a questo dato. Ricollega Fitbit e accetta tutti i permessi.');
  if (res.status === 429) throw new Error('Fitbit ha limitato le richieste: riprova tra qualche minuto.');
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(`Errore Fitbit (${res.status}): ${j?.errors?.[0]?.message ?? res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/* ---------- dati ---------- */

/** Registra l'allenamento su Fitbit come attività "Weights". Restituisce l'id del registro. */
export async function logWorkout(session: WorkoutSession, weightKg?: number): Promise<number> {
  const minutes = Math.max(1, session.durationMinutes);
  const body = new URLSearchParams({
    activityName: 'Weights',
    manualCalories: String(estimateCalories({ minutes, avgBpm: session.avgBpm, weightKg })),
    startTime: clock(session.startedAt, true),
    durationMillis: String(minutes * 60_000),
    date: isoDay(session.startedAt)
  });
  const res = await api<{ activityLog?: { logId: number } }>('/1/user/-/activities.json', { method: 'POST', body });
  return res.activityLog?.logId ?? 0;
}

/**
 * Frequenza media e massima nella finestra dell'allenamento.
 * Serve che l'orologio abbia già sincronizzato con Fitbit e che l'app sia di tipo "Personal".
 */
export async function fetchHeartRate(session: WorkoutSession): Promise<{ avg: number; max: number } | null> {
  const day = isoDay(session.startedAt);
  const from = clock(session.startedAt);
  const sameDay = isoDay(session.endedAt) === day;
  const to = sameDay ? clock(session.endedAt) : '23:59';
  const res = await api<{ 'activities-heart-intraday'?: { dataset?: { time: string; value: number }[] } }>(
    `/1/user/-/activities/heart/date/${day}/1d/1min/time/${from}/${to}.json`
  );
  return summarizeHeartRate(res['activities-heart-intraday']?.dataset ?? []);
}

/** Pesate (e massa grassa) degli ultimi `days` giorni (massimo 31 per richiesta). */
export async function fetchBody(days = 30): Promise<BodyEntry[]> {
  const to = isoDay(Date.now());
  const from = isoDay(Date.now() - Math.min(days, 31) * 86_400_000);
  const [w, f] = await Promise.all([
    api<{ weight?: { date: string; weight: number }[] }>(`/1/user/-/body/log/weight/date/${from}/${to}.json`),
    api<{ fat?: { date: string; fat: number }[] }>(`/1/user/-/body/log/fat/date/${from}/${to}.json`).catch(() => ({ fat: [] }))
  ]);
  return mergeBody(w.weight ?? [], f.fat ?? []);
}

/** Registra peso e/o massa grassa su Fitbit (stessa unità del profilo: l'header Accept-Language è metrico). */
export async function logBody(entry: BodyEntry): Promise<void> {
  if (entry.weightKg !== undefined) {
    await api('/1/user/-/body/log/weight.json', { method: 'POST', body: new URLSearchParams({ weight: String(entry.weightKg), date: entry.date, time: '12:00:00' }) });
  }
  if (entry.bodyFat !== undefined) {
    await api('/1/user/-/body/log/fat.json', { method: 'POST', body: new URLSearchParams({ fat: String(entry.bodyFat), date: entry.date, time: '12:00:00' }) });
  }
}
