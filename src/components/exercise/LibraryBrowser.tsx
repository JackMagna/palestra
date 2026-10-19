import { useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLibrary } from '../../hooks/useLibrary';
import {
  EQUIPMENT_LABELS, MUSCLE_LABELS, filterLibrary, muscleLabel, equipmentLabel,
  type LibraryExercise, type LibraryMuscle
} from '../../lib/exerciseLibrary';
import { Button } from '../ui/Button';
import { SafeImg } from './SafeImg';

const PAGE = 40;

interface Props {
  onSelect: (e: LibraryExercise) => void;
  selectedId?: string;
  /** suggerimento iniziale per la ricerca (es. nome dell'esercizio in scheda) */
  initialQuery?: string;
  dense?: boolean;
}

export function LibraryBrowser({ onSelect, selectedId, initialQuery = '', dense }: Props) {
  const { list, status, retry } = useLibrary();
  const [query, setQuery] = useState(initialQuery);
  const [muscle, setMuscle] = useState<LibraryMuscle | ''>('');
  const [equipment, setEquipment] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => filterLibrary(list, { query: deferredQuery, muscle, equipment, category: '' }),
    [list, deferredQuery, muscle, equipment]
  );

  if (status === 'error') {
    return (
      <div className="card p-5">
        <p className="mb-3 text-[15px]">Non riesco a caricare la libreria esercizi. Controlla la connessione.</p>
        <Button onClick={retry}>Riprova</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Cerca esercizio</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
            placeholder="Cerca in inglese, es. leg press, curl, row"
            className="field pl-9"
          />
        </label>
        <label>
          <span className="sr-only">Muscolo</span>
          <select value={muscle} onChange={(e) => { setMuscle(e.target.value as LibraryMuscle | ''); setLimit(PAGE); }} className="field sm:w-44">
            <option value="">Tutti i muscoli</option>
            {(Object.keys(MUSCLE_LABELS) as LibraryMuscle[])
              .sort((a, b) => MUSCLE_LABELS[a].localeCompare(MUSCLE_LABELS[b]))
              .map((m) => <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Attrezzatura</span>
          <select value={equipment} onChange={(e) => { setEquipment(e.target.value); setLimit(PAGE); }} className="field sm:w-44">
            <option value="">Ogni attrezzatura</option>
            {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-faint" aria-live="polite">
        {status === 'loading' ? 'Carico la libreria…' : `${results.length} esercizi`}
      </p>

      <ul className={`grid gap-3 ${dense ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
        {results.slice(0, limit).map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onSelect(e)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition hover:border-faint ${selectedId === e.id ? 'border-plate bg-plate/10' : 'border-line bg-panel'}`}
            >
              <span className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-ink">
                <SafeImg path={e.images[0]} alt="" className="h-full w-full bg-white object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{e.name}</span>
                <span className="block truncate text-sm text-muted">
                  {e.primaryMuscles.map(muscleLabel).join(', ')} · {equipmentLabel(e.equipment)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {results.length > limit && (
        <Button block onClick={() => setLimit((l) => l + PAGE)}>Mostra altri esercizi</Button>
      )}
    </div>
  );
}
