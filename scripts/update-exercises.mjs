// Aggiorna la copia locale di free-exercise-db (dominio pubblico, Unlicense).
// Uso: node scripts/update-exercises.mjs
// Dopo l'aggiornamento, allinea LIBRARY_COMMIT in src/lib/exerciseLibrary.ts
// al commit scaricato, così le immagini su jsDelivr corrispondono ai dati.
import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const KEEP = ['id', 'name', 'force', 'level', 'mechanic', 'equipment', 'primaryMuscles', 'secondaryMuscles', 'instructions', 'category', 'images'];

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Download fallito: ${res.status}`);
const data = await res.json();
const slim = data.map((e) => Object.fromEntries(KEEP.map((k) => [k, e[k] ?? null])));
await writeFile(new URL('../public/data/exercises.json', import.meta.url), JSON.stringify(slim));
console.log(`Salvati ${slim.length} esercizi in public/data/exercises.json`);
