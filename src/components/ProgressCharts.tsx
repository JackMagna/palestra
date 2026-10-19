import React, { useState } from 'react';
import { 
  TrendingUp, 
  Scale, 
  Calendar, 
  Plus, 
  Ruler, 
  Flame, 
  CheckCircle2, 
  History, 
  Dumbbell, 
  Activity, 
  Bell 
} from 'lucide-react';

export interface MeasurementRecord {
  id: string;
  date: string;
  weightKg: number;
  bodyFat?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  thighsCm?: number;
  notes?: string;
}

interface ProgressChartsProps {
  measurements: MeasurementRecord[];
  onAddMeasurement: (record: Omit<MeasurementRecord, 'id'>) => Promise<void>;
  workoutVolumeHistory: { week: number; volumeKg: number }[];
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  measurements,
  onAddMeasurement,
  workoutVolumeHistory
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [weightKg, setWeightKg] = useState<string>('75.0');
  const [bodyFat, setBodyFat] = useState<string>('14.5');
  const [chestCm, setChestCm] = useState<string>('102');
  const [waistCm, setWaistCm] = useState<string>('82');
  const [armsCm, setArmsCm] = useState<string>('36');
  const [thighsCm, setThighsCm] = useState<string>('57');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;

    setIsSubmitting(true);
    try {
      await onAddMeasurement({
        date: new Date().toISOString().split('T')[0],
        weightKg: parseFloat(weightKg),
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
        chestCm: chestCm ? parseFloat(chestCm) : undefined,
        waistCm: waistCm ? parseFloat(waistCm) : undefined,
        armsCm: armsCm ? parseFloat(armsCm) : undefined,
        thighsCm: thighsCm ? parseFloat(thighsCm) : undefined,
        notes: notes.trim() || undefined
      });
      setShowAddForm(false);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sorted measurements
  const sortedMeasurements = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sortedMeasurements[sortedMeasurements.length - 1];
  const previous = sortedMeasurements.length > 1 ? sortedMeasurements[sortedMeasurements.length - 2] : null;

  const weightDelta = latest && previous ? (latest.weightKg - previous.weightKg).toFixed(1) : null;

  // Simple SVG Line Chart generator
  const renderLineChart = (data: { label: string; value: number }[], color: string, unit: string) => {
    if (data.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center text-xs text-slate-500">
          Nessun dato registrato ancora. Inserisci la prima pesata!
        </div>
      );
    }

    const minVal = Math.min(...data.map(d => d.value)) * 0.95;
    const maxVal = Math.max(...data.map(d => d.value)) * 1.05 || 100;
    const range = maxVal - minVal || 1;

    const width = 450;
    const height = 150;
    const padding = 25;

    const points = data.map((d, idx) => {
      const x = padding + (idx / Math.max(1, data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
      return { x, y, ...d };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 text-xs font-mono">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" opacity={0.4} />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3 3" opacity={0.4} />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeDasharray="3 3" opacity={0.4} />

          {/* Area under curve */}
          {points.length > 1 && (
            <path
              d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill={color}
              fillOpacity={0.15}
            />
          )}

          {/* Line */}
          <path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#0F172A" stroke={color} strokeWidth="2.5" />
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="bold">
                {p.value}{unit}
              </text>
              <text x={p.x} y={height - 8} textAnchor="middle" fill="#94A3B8" fontSize="9">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Reminder Banner Dario PT */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 shadow-lg">
        <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-bold text-amber-300 uppercase tracking-wide">
            Promemoria Personal Trainer Dario:
          </p>
          <p>
            • Pesa te stesso al mattino a digiuno, dopo essere andato in bagno, 1 volta a settimana (stesso giorno, es. Lunedì).
          </p>
          <p>
            • Misura le circonferenze (braccia, torace, vita, cosce) ogni 2 settimane per monitorare la composizione corporea e verificare che i carichi in aumento si traducano in ipertrofia pulita.
          </p>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            Peso Attuale
          </span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">
            {latest ? `${latest.weightKg} kg` : '—'}
          </p>
          {weightDelta && (
            <span className={`text-[11px] font-mono ${Number(weightDelta) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Number(weightDelta) > 0 ? `+${weightDelta}` : weightDelta} kg da ultima
            </span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Massa Grassa
          </span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">
            {latest?.bodyFat ? `${latest.bodyFat}%` : '—'}
          </p>
          <span className="text-[11px] text-slate-400">Stima corporea</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-indigo-400" />
            Braccio / Torace
          </span>
          <p className="text-xl font-bold text-white font-mono mt-1">
            {latest?.armsCm ? `${latest.armsCm} cm` : '—'} / {latest?.chestCm ? `${latest.chestCm} cm` : '—'}
          </p>
          <span className="text-[11px] text-slate-400">Circonferenze</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-rose-400" />
            Volume Totale
          </span>
          <p className="text-xl font-bold text-white font-mono mt-1">
            {workoutVolumeHistory.length > 0 
              ? `${workoutVolumeHistory[workoutVolumeHistory.length - 1].volumeKg.toLocaleString()} kg` 
              : '—'}
          </p>
          <span className="text-[11px] text-slate-400">Ultimo allenamento</span>
        </div>
      </div>

      {/* Button to toggle New Measurement Form */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Grafici Progressi & Misure Corporee
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Chiudi Form' : 'Aggiungi Misurazione'}</span>
        </button>
      </div>

      {/* Add Measurement Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Registra Nuove Misure Fisiche
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Peso Corporeo (kg)*</label>
              <input
                type="number"
                step="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Massa Grassa (%)</label>
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Circonferenza Braccio (cm)</label>
              <input
                type="number"
                step="0.5"
                value={armsCm}
                onChange={(e) => setArmsCm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Torace (cm)</label>
              <input
                type="number"
                step="0.5"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Vita (cm)</label>
              <input
                type="number"
                step="0.5"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Coscia (cm)</label>
              <input
                type="number"
                step="0.5"
                value={thighsCm}
                onChange={(e) => setThighsCm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Note del giorno (sensazioni, alimentazione)</label>
            <input
              type="text"
              placeholder="es. Ottima energia, pump marcato sulle spalle"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva Misura'}
            </button>
          </div>
        </form>
      )}

      {/* Progress Line Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weight Progression Chart */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-400">Progressione Peso Corporeo</span>
            <span className="text-[11px] font-mono text-slate-400">Target ipertrofia controllata</span>
          </div>
          {renderLineChart(
            sortedMeasurements.map((m) => ({
              label: m.date.slice(5),
              value: m.weightKg
            })),
            '#F59E0B',
            'kg'
          )}
        </div>

        {/* Arms Circumference Progression Chart */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-400">Progressione Braccia (cm)</span>
            <span className="text-[11px] font-mono text-slate-400">Circonferenza bicipite/tricipite</span>
          </div>
          {renderLineChart(
            sortedMeasurements.filter(m => m.armsCm).map((m) => ({
              label: m.date.slice(5),
              value: m.armsCm!
            })),
            '#10B981',
            'cm'
          )}
        </div>
      </div>

      {/* History Log List */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
          <History className="w-4 h-4 text-amber-400" />
          <span>Storico Misurazioni Registrate</span>
        </div>

        {sortedMeasurements.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">Nessuna misurazione ancora memorizzata.</p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {sortedMeasurements.slice().reverse().map((rec) => (
              <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">{rec.weightKg} kg</span>
                    {rec.bodyFat && (
                      <span className="text-xs text-slate-400 font-mono">({rec.bodyFat}% BF)</span>
                    )}
                    <span className="text-xs text-amber-400 font-mono">· {rec.date}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 space-x-3">
                    {rec.armsCm && <span>Braccio: {rec.armsCm} cm</span>}
                    {rec.chestCm && <span>Torace: {rec.chestCm} cm</span>}
                    {rec.waistCm && <span>Vita: {rec.waistCm} cm</span>}
                    {rec.thighsCm && <span>Coscia: {rec.thighsCm} cm</span>}
                  </div>
                </div>
                {rec.notes && (
                  <span className="text-xs text-slate-400 italic bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    "{rec.notes}"
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
