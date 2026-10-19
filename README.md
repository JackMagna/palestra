# IronTrack

App web (PWA) per seguire la scheda in palestra: serie, carichi, recuperi, record e misure.
Funziona offline e si installa sul telefono.

- **Scheda modificabile** dall'app: giorni, esercizi, serie e ripetizioni per settimana, recuperi e note.
- **Libreria esercizi pubblica**: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio pubblico), 800+ esercizi con foto e muscoli.
- **Mappa muscolare**: [react-body-highlighter](https://github.com/giavinh79/react-body-highlighter) (MIT).
- **Dati**: Firestore con cache offline (con account Google) oppure solo sul dispositivo (senza account).
- **Google Sheets**: legge la scheda del coach dal foglio condiviso e ci scrive i carichi (accanto a "3X10" nella cella della settimana) e le misure (scheda "Misure"). Le celle che il coach modifica non vengono toccate.
- **Fitbit** (facoltativo): registra gli allenamenti, importa frequenza cardiaca e pesate. Richiede `VITE_FITBIT_CLIENT_ID` (vedi sotto).
- **Frequenza cardiaca** via Bluetooth (Chrome su Android e computer) ed esportazione TCX per Strava/Garmin.

## Sviluppo

```bash
bun install        # oppure npm install
bun run dev        # http://localhost:3000
bun run test       # test delle funzioni di calcolo
bun run build      # controllo dei tipi + build di produzione
```

## Aggiornare la libreria esercizi

```bash
bun run update-exercises
```

Poi aggiorna `LIBRARY_COMMIT` in `src/lib/exerciseLibrary.ts` con l'ultimo commit di free-exercise-db,
così le foto corrispondono ai dati.

## Fitbit

1. Registra un'app su <https://dev.fitbit.com/apps/new>: *OAuth 2.0 Application Type* = **Personal**, *Default Access Type* = **Read & Write**,
   *Redirect URL* = l'indirizzo dell'app con la barra finale (es. `https://palestra-kohl.vercel.app/`).
2. Copia l'*OAuth 2.0 Client ID* e salvalo su Vercel in *Settings → Environment Variables* come `VITE_FITBIT_CLIENT_ID`, poi rifai il deploy.
   In locale: copia `.env.example` in `.env.local` e compila il valore.
3. Nell'app: icona account → *Collega Fitbit*.

Il login usa OAuth con PKCE, quindi nel browser non c'è nessun segreto. Tutto il codice Fitbit è in `src/services/fitbit.ts`:
se Google sposta le API di Fitbit su Google Health API, basta sostituire quel file.

## Google Sheets e scheda del coach

Il foglio deve essere condiviso con il tuo account come **Editor**. Nell'app: *Scheda → Collega la scheda del coach*.
L'app riconosce righe `GIORNO 1`, colonne `1 SETT.`…`6 SETT.`, intestazioni di sezione (`PROGRESSIONE SERIE X REP RIP. 2'`) e gli esercizi.

## Firebase

La configurazione è in `firebase-applet-config.json`. La chiave API di Firebase per il web non è un segreto
(identifica il progetto, non dà accessi): la protezione è nelle regole di `firestore.rules`.
Dopo il deploy su Vercel, aggiungi il dominio in *Authentication → Impostazioni → Domini autorizzati*.

Per pubblicare le regole: `firebase deploy --only firestore:rules`.

## Struttura

```
src/
  components/   workout, program, exercise, progress, layout, ui
  hooks/        useAppData (dati), useLibrary, usePWA, useMediaQuery
  services/     firebase, googleSheets, fitbit, heartRate, normalize, localStore
  lib/          prescription, stats, csv, tcx, coachSheet, sheetWrite, pkce (con test in __tests__)
  data/         scheda di partenza
```
