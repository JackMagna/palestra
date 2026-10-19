# IronTrack: 3D Machine Animations & Health Connect Cloud Sync

Piano di implementazione per integrare clip 3D realistiche dei macchinari con rendering anatomico direttamente in-app, e attivare la sincronizzazione cloud automatica con Google Fit e Health Connect per smartwatch (Apple Watch, Wear OS, Galaxy Watch, Fitbit).

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisioni confermate dall'utente:
> - **Clip Dimostrative In-App**: Integrazione di clip 3D realistiche con rendering anatomico dei macchinari della palestra (Chest Press, Pulley con triangolo, Croci ai cavi, Lat Pulldown, Panca 70° manubri, Alzate laterali panca 60°, Leg Press 45°, Leg Curl seduto, ecc.) riprodotte in loop direttamente in app senza reindirizzamenti a YouTube.
> - **Sincronizzazione Smartwatch & Health Connect**: Sincronizzazione cloud automatica tramite le API di Google Fit / Health Connect (usando l'account Google già connesso per Google Drive), con spiegazione trasparente del flusso di dati tra smartphone, orologio e cloud.

---

## 1. Come Funziona il Passaggio Dati con Health Connect & Smartwatch

Nel sistema operativo Android e sugli smartwatch moderni (Wear OS, Samsung Galaxy Watch, Fitbit, Xiaomi, Pixel Watch):
1. **Perché prima c'era il Bluetooth diretto?**
   In una webapp / PWA, il browser gira in una sandbox sicura e non ha accesso diretto alle API native di basso livello di Android (`androidx.health.connect.client`) o iOS (`HealthKit`). La Web Bluetooth API permetteva di connettersi via radio direttamente al sensore ottico dell'orologio.
2. **Come avviene la sincronizzazione Cloud automatica con Health Connect?**
   Poiché l'utente effettua il login con Google per Google Drive e Google Sheets, possiamo estendere l'autorizzazione a **Google Fit REST API**.
   - Quando concludi un allenamento, l'app invia la sessione (durata, volume sollevato in kg, tipologia "Weightlifting / Strength Training", orario di inizio/fine e stima calorie) direttamente ai server cloud di Google Health/Fit.
   - L'applicazione **Health Connect** presente sul tuo telefono Android sincronizza automaticamente questi dati in locale sul dispositivo, condividendoli istantaneamente con Samsung Health, Google Fit, e con il tuo smartwatch.
   - Per gli utenti iOS/Apple Watch, l'app genera anche il download compatibile (.json / .tcx) per l'importazione istantanea in Apple Health.

---

## 2. Architettura Clip Animate 3D dei Macchinari

Per ogni esercizio della scheda Giacomo • Dario PT:
1. **Rendering 3D del Macchinario e dell'Atleta**:
   - `CHEST PRESS PRESA SOPRA`: Macchina chest press con carrello pesi in movimento, traiettoria orizzontale dei gomiti e attivazione visiva dei fasci pettorali.
   - `REMATORE AL PULLEY TRIANGOLO`: Cavo basso con presa a V (triangolo), scorrimento del carrello, adduzione scapolare evidenziata e retrazione dorsale.
   - `CROCI AI CAVI ALTI`: Cavi doppi alti, traiettoria circolare convergente verso il basso con gomiti bloccati.
   - `TRAZIONI PULL DOWN MACHINE`: Carico convergente guidato verso il petto con trazione dei gomiti verso il basso (focus dorsali).
   - `LENTO MANUBRI PANCA 70°`: Panca inclinata esattamente a 70° con manubri su piano scapolare.
   - `ALZATE LATERALI PRONO PANCA 60°`: Petto aderente allo schienale a 60° per isolamento del deltoide posteriore.
   - `REVERSE CRUNCH DECLINATA`: Panca declinata con arrotolamento del bacino.
   - `PRESSA 45°`: Carrello inclinato a 45° con spinta dei talloni e protezione lombare.
   - `LEG CURL SEDUTO`: Perno articolare al ginocchio e flessione femorali controllata.
   - `CURL BILANCIERE & PUSH DOWN SBARRA`: Gomiti incollati ai fianchi con movimento biomeccanico puro.
   - `CURL PANCA 45° & FRENCH PRESS PIANA`: Allungamento del bicipite e isolamento del tricipite.
   - `HIPEREXTENSION`: Panca 45° per catena cinetica posteriore e lombari.
2. **Controlli del Player**:
   - Tasto play/pausa
   - Selettore cadenza (discesa lenta 2-3s, fermo isometrico, salita)
   - Badge anatomico del muscolo bersaglio

---

## 3. Piano di Esecuzione Componenti

```
┌────────────────────────────────────────────────────────────────┐
│                    IronTrack PWA Screen                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             3D Realistic Machine Motion Player           │  │
│  │  • 3D Machine Visual (Chest Press / Pulley / Pressa 45)  │  │
│  │  • Active Muscle Target Glow (Pecs, Lats, Quads)         │  │
│  │  • Real-Time Tempo Guidance (3-0-1-0 Dario PT Cadence)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Google Fit & Health Connect              │  │
│  │  • Google Cloud Health API REST endpoint                 │  │
│  │  • Auto-Sync Strength Training Session                   │  │
│  │  • Smartwatch companion bridge                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

1. **Aggiornamento Servizio Google Fit & Health Connect (`src/services/googleFitSync.ts`)**:
   - Creazione del servizio per inviare sessioni di sollevamento pesi a `https://www.googleapis.com/fitness/v1/users/me/sessions`.
   - Mappatura precisa dei dati: durata, orario, calorie stimate, volume sollevato.
2. **Potenziamento del Player 3D dei Macchinari (`src/components/ExerciseMotionClip.tsx`)**:
   - Rendering 3D ad alta definizione del telaio del macchinario, del pacco pesi mobile, dei cavi e della figura anatomica con muscoli evidenziati a colori distintivi (rosso/ambra/verde).
   - Inclusione dei dati ExerciseDB statici ad alta risoluzione.
3. **Pannello di Stato Health Connect nel Workout (`src/components/SmartwatchModal.tsx`)**:
   - Spiegazione chiara a schermo dello stato di sincronizzazione Health Connect & Smartwatch.
   - Indicatore "Sincronizzato con Google Fit & Health Connect".
