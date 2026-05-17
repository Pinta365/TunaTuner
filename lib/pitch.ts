// pitch.ts — autocorrelation-based pitch detection + note math.

const NOTE_NAMES = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
];
const A4 = 440;

// ── Smoothing knobs — tweak to taste against a reference tuner ──
// EMA time constant in ms: the smoother reaches ~63% of a change in this
// time, independent of display refresh rate. Lower = snappier, higher = calmer.
const SMOOTH_MS = 75;
// A reading more than this many cents off the smoothed pitch is treated as a
// new note (snap to it) rather than jitter to be averaged.
const SNAP_CENTS = 60;

export interface Note {
  name: string;
  octave: number;
  cents: number;
  freqTarget: number;
  midi: number;
}

export interface PitchResult {
  freq: number;
  note: Note | null;
}

// Returns { name, octave, cents, freqTarget, midi } for a frequency.
export function freqToNote(freq: number): Note | null {
  if (!freq || !isFinite(freq) || freq <= 0) return null;
  const midiFloat = 69 + 12 * Math.log2(freq / A4);
  const midi = Math.round(midiFloat);
  const cents = (midiFloat - midi) * 100;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const freqTarget = A4 * Math.pow(2, (midi - 69) / 12);
  return { name, octave, cents, freqTarget, midi };
}

// Auto-correlation pitch detection
// Returns frequency in Hz, or -1 if not confident.
function autoCorrelate(
  buf: Float32Array,
  sampleRate: number,
  threshold: number,
): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < threshold) return -1; // too quiet

  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }
  const trimmed = buf.slice(r1, r2);
  const N = trimmed.length;

  const c = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < N; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  if (T0 <= 0) return -1;
  // parabolic interpolation around the peak for sub-sample accuracy
  const x1 = c[T0 - 1] || 0, x2 = c[T0], x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  const freq = sampleRate / T0;
  if (freq < 40 || freq > 2000) return -1;
  return freq;
}

// Start mic capture. The detect loop runs once per animation frame (display refresh rate);
// `getThreshold` is polled each frame for the live RMS noise gate. The
// reported frequency is median- + EMA-smoothed so a steady tone reads steady.
// Returns a stop() fn.
export async function start(
  cb: (result: PitchResult) => void,
  getThreshold: () => number = () => 0.01,
): Promise<() => void> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("No mic API");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  const Ctx = globalThis.AudioContext ||
    (globalThis as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctx();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  src.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let raf = 0;
  let stopped = false;

  // Smoothing state: a 3-reading median rejects single-frame octave glitches,
  // then a time-based EMA eases out the remaining few-cent jitter. `smoothed`
  // is 0 until a pitch is acquired; it resets whenever the signal drops.
  let smoothed = 0;
  let lastT = 0;
  const recent: number[] = [];

  const loop = (now: number) => {
    if (stopped) return;
    const dt = Math.min(100, lastT ? now - lastT : 16);
    lastT = now;

    analyser.getFloatTimeDomainData(buf);
    const raw = autoCorrelate(buf, ctx.sampleRate, getThreshold());

    if (raw <= 0) {
      smoothed = 0;
      recent.length = 0;
      cb({ freq: -1, note: null });
    } else {
      recent.push(raw);
      if (recent.length > 3) recent.shift();
      const sorted = [...recent].sort((a, b) => a - b);
      const med = sorted[sorted.length >> 1];

      if (smoothed <= 0) {
        smoothed = med; // first reading — acquire instantly
      } else if (Math.abs(1200 * Math.log2(med / smoothed)) > SNAP_CENTS) {
        smoothed = med; // big jump (new note/string) — snap, don't glide
      } else {
        // Time-based EMA weight: alpha = 1 - e^(-dt / tau).
        const alpha = 1 - Math.exp(-dt / SMOOTH_MS);
        smoothed += alpha * (med - smoothed);
      }
      cb({ freq: smoothed, note: freqToNote(smoothed) });
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };
}
