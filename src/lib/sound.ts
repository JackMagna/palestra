/** Segnali sonori brevi con Web Audio (nessun file da scaricare). */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

function tone(freq: number, start: number, duration: number, volume = 0.2, type: OscillatorType = 'sine') {
  const c = context();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(volume, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration);
}

/** Da chiamare dopo un tocco: sblocca l'audio su iOS */
export function unlockAudio() {
  context();
}

export const sound = {
  tick: () => tone(880, 0, 0.1, 0.12),
  setDone: () => tone(660, 0, 0.15, 0.18),
  restOver: () => {
    tone(1046, 0, 0.2, 0.3, 'triangle');
    tone(1318, 0.18, 0.3, 0.3, 'triangle');
    tone(1568, 0.36, 0.45, 0.3, 'triangle');
  }
};

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* vibrazione non supportata */
  }
}
