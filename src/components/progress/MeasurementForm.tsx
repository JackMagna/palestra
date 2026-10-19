import { useState } from 'react';
import type { Measurement } from '../../types';
import { newId, todayISO } from '../../lib/ids';
import { Button } from '../ui/Button';

const FIELDS: { key: keyof Measurement; label: string; unit: string }[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'bodyFat', label: 'Massa grassa', unit: '%' },
  { key: 'chestCm', label: 'Petto', unit: 'cm' },
  { key: 'waistCm', label: 'Vita', unit: 'cm' },
  { key: 'armsCm', label: 'Braccio', unit: 'cm' },
  { key: 'thighsCm', label: 'Coscia', unit: 'cm' }
];

export function MeasurementForm({ latest, onSave, onCancel }: { latest?: Measurement; onSave: (m: Measurement) => void; onCancel: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, latest?.[f.key] !== undefined ? String(latest[f.key]) : '']))
  );
  const [notes, setNotes] = useState('');
  const num = (k: string) => (values[k]?.trim() ? Number(values[k].replace(',', '.')) : undefined);
  const weight = num('weightKg');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!weight) return;
        onSave({
          id: newId('m'),
          date,
          weightKg: weight,
          bodyFat: num('bodyFat'),
          chestCm: num('chestCm'),
          waistCm: num('waistCm'),
          armsCm: num('armsCm'),
          thighsCm: num('thighsCm'),
          notes: notes.trim() || undefined
        });
      }}
    >
      {latest && <p className="text-sm text-faint">I campi partono dall'ultima misurazione: cambia solo quello che serve.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-3">
          <label className="label" htmlFor="m-date">Data</label>
          <input id="m-date" type="date" className="field" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={`m-${f.key}`}>{f.label} ({f.unit}){f.key === 'weightKg' ? '' : ', facoltativo'}</label>
            <input
              id={`m-${f.key}`} className="field" inputMode="decimal" required={f.key === 'weightKg'}
              value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="m-notes">Note</label>
        <input id="m-notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Es. pesata a digiuno" />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Annulla</Button>
        <Button type="submit" variant="primary" disabled={!weight}>Salva misura</Button>
      </div>
    </form>
  );
}
