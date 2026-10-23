export interface HrPoint { time: string; value: number }

export function summarizeHeartRate(points: HrPoint[]): { avg: number; max: number } | null {
  const v = points.map((p) => p.value).filter((n) => Number.isFinite(n) && n > 30 && n < 230);
  if (v.length < 3) return null;
  return { avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), max: Math.max(...v) };
}

/** Calorie dell'allenamento: formula di Keytel con la frequenza media, altrimenti 3,5 MET (pesi, intensità media). */
export function estimateCalories(opts: { minutes: number; avgBpm?: number; weightKg?: number; age?: number }): number {
  const { minutes, avgBpm, weightKg = 75, age = 30 } = opts;
  if (minutes <= 0) return 0;
  if (avgBpm && avgBpm > 60) {
    const perMin = (-55.0969 + 0.6309 * avgBpm + 0.1988 * weightKg + 0.2017 * age) / 4.184;
    return Math.max(1, Math.round(perMin * minutes));
  }
  return Math.max(1, Math.round(3.5 * weightKg * (minutes / 60)));
}

const pad = (n: number) => String(n).padStart(2, '0');
export const clock = (ms: number, seconds = false) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}${seconds ? `:${pad(d.getSeconds())}` : ''}`;
};
export const isoDay = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export interface BodyEntry { date: string; weightKg?: number; bodyFat?: number }

/** Unisce i registri di peso e di massa grassa di Fitbit, uno per giorno (vale l'ultimo del giorno). */
export function mergeBody(weights: { date: string; weight: number }[], fats: { date: string; fat: number }[]): BodyEntry[] {
  const fatByDay = new Map(fats.map((f) => [f.date, f.fat]));
  const byDay = new Map<string, BodyEntry>();
  for (const w of weights) {
    byDay.set(w.date, { date: w.date, weightKg: Math.round(w.weight * 10) / 10, bodyFat: fatByDay.has(w.date) ? Math.round(fatByDay.get(w.date)! * 10) / 10 : undefined });
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}
