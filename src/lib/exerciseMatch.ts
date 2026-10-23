import type { LibraryExercise } from './exerciseLibrary';
import { normalize } from './exerciseLibrary';

/** Parole da palestra italiane -> inglese, per proporre il collegamento alla libreria. */
const IT_EN: Record<string, string[]> = {
  chest: ['chest'], petto: ['chest'], pressa: ['leg', 'press'], panca: ['bench'], piana: ['flat'],
  rematore: ['row'], pulley: ['cable'], cavi: ['cable'], cavo: ['cable'], triangolo: ['v', 'bar'],
  croci: ['fly'], crossover: ['crossover'], trazioni: ['pulldown'], pull: ['pulldown'], down: ['pulldown'],
  lento: ['shoulder', 'press'], military: ['military', 'press'], spinte: ['press'], distensioni: ['press'],
  manubri: ['dumbbell'], manubrio: ['dumbbell'], bilanciere: ['barbell'], sbarra: ['bar'],
  alzate: ['raise'], laterali: ['lateral'], prono: ['rear'], posteriori: ['rear'],
  curl: ['curl'], push: ['pushdown'], french: ['triceps', 'extension'], seduto: ['seated'],
  leg: ['leg'], extension: ['extension'], crunch: ['crunch'], reverse: ['reverse'], declinata: ['decline'],
  hyperextension: ['hyperextension'], iperestensioni: ['hyperextension'], hiperextension: ['hyperextension'],
  revers: ['reverse'], squat: ['squat'], affondi: ['lunge'], stacco: ['deadlift'], stacchi: ['deadlift'], rumeno: ['romanian'],
  polpacci: ['calf'], calf: ['calf'], plank: ['plank'], parallele: ['dip'], dip: ['dip'],
  tricipiti: ['triceps'], bicipiti: ['biceps'], glutei: ['glute'], thrust: ['thrust'], press: ['press'],
  inclinata: ['incline'], inclinato: ['incline']
};
/** Varianti particolari: si preferiscono solo se il nome in scheda le nomina */
const VARIANT = new Set(['reverse', 'single', 'one', 'alternate', 'smith', 'weighted', 'band', 'ball', 'suspended']);
const NOISE = new Set(['di', 'al', 'ai', 'alla', 'con', 'a', 'e', 'su', 'in', 'da', 'del', 'presa', 'sopra', 'sotto', 'machine', 'macchina']);

const stem = (w: string) => w.replace(/s$/, '');

function englishTokens(name: string): string[] {
  const out: string[] = [];
  for (const w of normalize(name).split(' ')) {
    if (!w || NOISE.has(w) || /^\d+$/.test(w)) continue;
    out.push(...(IT_EN[w] ?? [w]));
  }
  return [...new Set(out.map(stem))];
}

/** Migliore esercizio della libreria per il nome in scheda, o undefined se non c'è abbastanza somiglianza. */
export function suggestLibraryId(name: string, library: LibraryExercise[]): string | undefined {
  const want = englishTokens(name);
  if (want.length === 0) return undefined;
  let best: { id: string; score: number } | undefined;
  for (const e of library) {
    const words = new Set(normalize(e.name).split(' ').map(stem));
    const hit = want.filter((t) => words.has(t)).length;
    if (hit < Math.min(2, want.length)) continue;
    // premia chi copre più parole cercate e ha meno parole in più
    const variants = [...words].filter((w) => VARIANT.has(w) && !want.includes(w)).length;
    const score = hit * 10 - Math.abs(words.size - want.length) - variants * 4;
    if (!best || score > best.score) best = { id: e.id, score };
  }
  return best?.id;
}
