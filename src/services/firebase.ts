import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  type User
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { readJSON, removeKey, writeJSON } from '../lib/storage';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Cache locale persistente: l'app funziona offline e le scritture vengono
 * inviate quando torna la rete. ignoreUndefinedProperties evita errori
 * sui campi facoltativi lasciati vuoti.
 */
export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
    // alcune reti mobili bloccano lo streaming: in quel caso passa a richieste normali
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  },
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId
);

const SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

function provider(withSheets: boolean) {
  const p = new GoogleAuthProvider();
  if (withSheets) SHEETS_SCOPES.forEach((s) => p.addScope(s));
  return p;
}

/* ---------- Token di accesso Google (per Sheets) ----------
 * Firebase non conserva il token OAuth di Google: dura circa un'ora e si perde
 * ricaricando la pagina. Lo salviamo con la sua scadenza e, quando scade,
 * chiediamo all'utente di ricollegare Google con un tocco.
 */
const TOKEN_KEY = 'irontrack:google-token';
const TOKEN_TTL_MS = 55 * 60 * 1000;

interface StoredToken {
  token: string;
  expiresAt: number;
  uid: string;
}

export function getValidGoogleToken(): string | null {
  const stored = readJSON<StoredToken | null>(TOKEN_KEY, null);
  if (!stored || stored.uid !== auth.currentUser?.uid) return null;
  return stored.expiresAt > Date.now() + 30_000 ? stored.token : null;
}

function storeToken(user: User, token: string | undefined) {
  if (token) writeJSON(TOKEN_KEY, { token, uid: user.uid, expiresAt: Date.now() + TOKEN_TTL_MS } satisfies StoredToken);
}

export class GoogleTokenExpiredError extends Error {
  constructor() {
    super('Il collegamento con Google è scaduto. Tocca "Ricollega Google" e riprova.');
    this.name = 'GoogleTokenExpiredError';
  }
}

/** Accesso con Google. Il permesso per Sheets viene chiesto solo quando serve. */
export async function signInWithGoogle(withSheets = false): Promise<User> {
  const result = await signInWithPopup(auth, provider(withSheets));
  storeToken(result.user, GoogleAuthProvider.credentialFromResult(result)?.accessToken);
  return result.user;
}

/** Ottiene un token valido per Google Sheets, aprendo il popup solo se necessario. */
export async function ensureGoogleToken(): Promise<string> {
  const existing = getValidGoogleToken();
  if (existing) return existing;
  const user = auth.currentUser;
  const result = user
    ? await reauthenticateWithPopup(user, provider(true))
    : await signInWithPopup(auth, provider(true));
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error('Google non ha restituito il permesso per Sheets.');
  storeToken(result.user, token);
  return token;
}

/**
 * Esegue una chiamata Google con il token giusto.
 * - interactive=true: se serve apre il popup di Google (da usare dopo un tocco dell'utente).
 * - interactive=false: non apre nulla; se il token è scaduto restituisce undefined.
 */
export async function withGoogleToken<T>(fn: (token: string) => Promise<T>, interactive = true): Promise<T | undefined> {
  const quiet = getValidGoogleToken();
  if (!interactive && !quiet) return undefined;
  try {
    return await fn(quiet ?? (await ensureGoogleToken()));
  } catch (err) {
    if (!(err instanceof GoogleTokenExpiredError)) throw err;
    clearGoogleToken();
    if (!interactive) return undefined;
    return fn(await ensureGoogleToken());
  }
}

export function clearGoogleToken() {
  removeKey(TOKEN_KEY);
}

export async function logout() {
  clearGoogleToken();
  await signOut(auth);
}

export function watchAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

/** Messaggio leggibile per gli errori di accesso più comuni */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'Accesso annullato.';
  if (code.includes('popup-blocked')) return 'Il browser ha bloccato il popup di Google. Consenti i popup per questo sito e riprova.';
  if (code.includes('unauthorized-domain')) return 'Questo dominio non è autorizzato in Firebase. Aggiungilo in Authentication > Impostazioni > Domini autorizzati.';
  if (code.includes('network')) return 'Nessuna connessione. Riprova quando sei online.';
  return err instanceof Error ? err.message : 'Accesso non riuscito.';
}
