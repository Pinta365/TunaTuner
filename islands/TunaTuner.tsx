// TunaTuner.tsx — the full TunaTuner dashboard
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import Finley from "../components/Finley.tsx";
import {
  type FinleyPalette,
  INSTRUMENTS,
  midiToNoteName,
  type NoteNotation,
  noteToFreq,
  OCEAN,
  OCEAN_FINLEY,
  stringMidi,
  type Theme,
} from "../lib/theme.ts";
import { type Note, start as startPitch } from "../lib/pitch.ts";

type Status = "idle" | "in-tune" | "sharp" | "flat";

// In-tune hysteresis (cents): lock in below ENTER, but don't drop the lock
// until past EXIT — the gap stops Finley flickering at the boundary.
const IN_TUNE_ENTER = 5;
const IN_TUNE_EXIT = 9;

// ─── Bubbles particle field ─────────────────────────────────────
interface BubbleSpec {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

function Bubbles({ active, color }: { active: boolean; color: string }) {
  const [bubbles, setBubbles] = useState<BubbleSpec[]>([]);
  useEffect(() => {
    setBubbles(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        size: 4 + Math.random() * 14,
        duration: 6 + Math.random() * 8,
        delay: -Math.random() * 14,
        drift: -10 + Math.random() * 20,
      })),
    );
  }, []);
  return (
    <div class="bubbles-layer" aria-hidden="true">
      {bubbles.map((b) => (
        <div
          key={b.id}
          class="bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            background:
              `radial-gradient(circle at 35% 30%, ${color}cc, ${color}33)`,
            borderColor: `${color}88`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: active ? 0.85 : 0.55,
            "--drift": `${b.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────
function Header(
  {
    theme,
    instrumentKey,
    tuning,
    notation,
    onNotation,
    onInstrument,
    onTuning,
  }: {
    theme: Theme;
    instrumentKey: string;
    tuning: string;
    notation: NoteNotation;
    onNotation: (notation: NoteNotation) => void;
    onInstrument: (k: string) => void;
    onTuning: (t: string) => void;
  },
) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const inst = INSTRUMENTS[instrumentKey];
  return (
    <header class="tt-header">
      <div class="tt-logo">
        <div class="tt-logo-fish">
          <svg viewBox="0 0 36 24" width="32" height="22">
            <path
              d="M 28 12 C 28 6, 18 4, 12 8 L 6 12 L 12 16 C 18 20, 28 18, 28 12 Z"
              fill={theme.logoFish}
            />
            <path
              d="M 6 12 L 0 6 L 2 12 L 0 18 Z"
              fill={theme.logoFish}
              opacity="0.85"
            />
            <circle cx="24" cy="10" r="1.6" fill="#fff" />
            <circle cx="24" cy="10" r="0.8" fill="#000" />
          </svg>
          <span
            class="tt-logo-bubble"
            style={{ background: theme.accentSoft }}
          />
        </div>
        <div class="tt-logo-wordmark">
          <span class="tt-logo-text">TunaTuner</span>
          <span class="tt-logo-tag">with Finley the Tuna</span>
        </div>
      </div>
      <div class="tt-header-right">
        <div class="tt-notation" role="radiogroup" aria-label="Note notation">
          <button
            type="button"
            class={"tt-notation-btn " +
              (notation === "flats" ? "is-active" : "")}
            onClick={() => onNotation("flats")}
            aria-pressed={notation === "flats"}
            title="Show flats (E♭, A♭, B♭)"
          >
            Flats
          </button>
          <button
            type="button"
            class={"tt-notation-btn " +
              (notation === "sharps" ? "is-active" : "")}
            onClick={() => onNotation("sharps")}
            aria-pressed={notation === "sharps"}
            title="Show sharps (D♯, G♯, A♯)"
          >
            Sharps
          </button>
        </div>
        <div class="tt-tackle" ref={ref}>
          <button
            type="button"
            class="tt-tackle-btn"
            onClick={() => setOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <rect x="2" y="5" width="12" height="9" rx="1.5" />
              <path d="M 5 5 V 3 H 11 V 5" />
              <path d="M 2 9 H 14" />
            </svg>
            <span>{inst.label}</span>
            <svg
              viewBox="0 0 12 12"
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M 3 4.5 L 6 7.5 L 9 4.5" />
            </svg>
          </button>
          {open && (
            <div class="tt-tackle-menu">
              {Object.keys(INSTRUMENTS).map((instKey) => {
                const inst = INSTRUMENTS[instKey];
                const isSelectedInst = instKey === instrumentKey;
                const hasNoTunings = !inst.tunings;
                if (hasNoTunings) {
                  return (
                    <button
                      type="button"
                      key={instKey}
                      class={isSelectedInst ? "is-active" : ""}
                      onClick={() => {
                        onInstrument(instKey);
                        setOpen(false);
                      }}
                    >
                      {inst.label}
                    </button>
                  );
                }
                return (
                  <div key={instKey}>
                    <div class="tt-tackle-group-label">
                      {inst.label}
                    </div>
                    {Object.keys(inst.tunings!).map((tuneKey) => {
                      const tune = inst.tunings![tuneKey];
                      const isSelected = isSelectedInst && tuning === tuneKey;
                      return (
                        <button
                          type="button"
                          key={`${instKey}-${tuneKey}`}
                          class={isSelected ? "is-active" : "tt-tune-sub"}
                          onClick={() => {
                            onInstrument(instKey);
                            onTuning(tuneKey);
                            setOpen(false);
                          }}
                        >
                          {tune.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── String picker row ──────────────────────────────────────────
function StringRow(
  {
    instrumentKey,
    tuning,
    notation,
    currentMidi,
    pinnedMidi,
    onPin,
    theme,
  }: {
    instrumentKey: string;
    tuning: string;
    notation: NoteNotation;
    currentMidi: number | null;
    pinnedMidi: number | null;
    onPin: (midi: number | null) => void;
    theme: Theme;
  },
) {
  const inst = INSTRUMENTS[instrumentKey];
  if (!inst.tunings || !inst.tunings[tuning]) return null;
  const strings = inst.tunings[tuning].strings;
  // Closest string.
  let closest = -1;
  if (pinnedMidi == null && currentMidi != null) {
    let best = 1e9;
    strings.forEach((s, i) => {
      const d = Math.abs(stringMidi(s) - currentMidi);
      if (d < best) {
        best = d;
        closest = i;
      }
    });
  }
  return (
    <div class="tt-strings">
      {strings.map((s, i) => {
        const midi = stringMidi(s);
        const displayName = midiToNoteName(midi, notation);
        const pinned = pinnedMidi === midi;
        const isClosest = !pinned && i === closest;
        return (
          <button
            type="button"
            key={i}
            class={"tt-string " +
              (pinned ? "is-pinned" : isClosest ? "is-active" : "")}
            onClick={() => onPin(pinned ? null : midi)}
            title={pinned
              ? `Locked on ${displayName}${s.octave} — tap to release`
              : `Lock onto ${displayName}${s.octave}`}
            style={pinned
              ? { borderColor: theme.stateNeutral, color: theme.stateNeutral }
              : undefined}
          >
            <span class="tt-string-note">{displayName}</span>
            <span class="tt-string-oct">{s.octave}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Aquarium view: huge note + Finley + bubbles ────────────────
function AquariumView(
  {
    noteName,
    octave,
    cents,
    freq,
    status,
    theme,
    finleyPalette,
    active,
    inTune,
    micError,
  }: {
    noteName: string | null;
    octave: number | null;
    cents: number;
    freq: number | null;
    status: Status;
    theme: Theme;
    finleyPalette: FinleyPalette;
    active: boolean;
    inTune: boolean;
    micError: string | null;
  },
) {
  // status color for accent text
  const statusColor = status === "in-tune"
    ? theme.stateIn
    : status === "sharp"
    ? theme.stateSharp
    : status === "flat"
    ? theme.stateFlat
    : theme.stateNeutral;

  // Cents bar fill: -50..+50 mapped to -50%..+50%
  const fill = Math.max(-50, Math.min(50, cents || 0));
  const barColor = statusColor;

  return (
    <div
      class="tt-aquarium"
      style={{
        background: theme.panelBg,
        borderColor: theme.panelBorder,
        boxShadow: inTune
          ? `0 0 80px ${theme.stateIn}66, inset 0 0 60px ${theme.stateIn}22`
          : `inset 0 0 60px ${theme.aquariumInner}`,
      }}
    >
      <Bubbles active={active} color={theme.bubble} />

      {/* Cents bar at top */}
      <div class="tt-cents-bar">
        <div class="tt-cents-track" />
        <div class="tt-cents-tick" style={{ left: "0%" }} />
        <div class="tt-cents-tick" style={{ left: "12.5%" }} />
        <div class="tt-cents-tick" style={{ left: "25%" }} />
        <div class="tt-cents-tick" style={{ left: "37.5%" }} />
        <div class="tt-cents-tick is-center" style={{ left: "50%" }} />
        <div class="tt-cents-tick" style={{ left: "62.5%" }} />
        <div class="tt-cents-tick" style={{ left: "75%" }} />
        <div class="tt-cents-tick" style={{ left: "87.5%" }} />
        <div class="tt-cents-tick" style={{ left: "100%" }} />
        <div
          class="tt-cents-bubble"
          style={{
            left: `${50 + fill}%`,
            background:
              `radial-gradient(circle at 35% 30%, ${barColor}, ${barColor}66 60%, ${barColor}00)`,
            boxShadow:
              `0 0 12px ${barColor}cc, 0 0 24px ${barColor}66, 0 0 48px ${barColor}33, inset 0 0 6px ${barColor}`,
            borderColor: barColor,
          }}
        >
          <span class="tt-cents-bubble-val" style={{ color: barColor }}>
            {Math.round(cents) > 0 ? "+" : ""}
            {Math.round(cents)}
          </span>
        </div>
        <div class="tt-cents-label" style={{ left: "0%" }}>flat</div>
        <div class="tt-cents-label tt-cents-label-r" style={{ left: "100%" }}>
          sharp
        </div>
      </div>

      {/* Note display */}
      <div class="tt-note-stack">
        {micError
          ? (
            <div class="tt-mic-alert" role="alert">
              <svg
                class="tt-mic-alert-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.stateSharp}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M 5 11 a 7 7 0 0 0 14 0" />
                <path d="M 12 18 v 3" />
                <path d="M 8 21 h 8" />
                <path d="M 3 3 L 21 21" />
              </svg>
              <div
                class="tt-mic-alert-title"
                style={{ color: theme.stateSharp }}
              >
                Finley can't hear you
              </div>
              <div class="tt-mic-alert-msg">{micError}</div>
            </div>
          )
          : (
            <>
              <div
                class="tt-note-name"
                style={{
                  color: statusColor,
                  textShadow:
                    `0 0 60px ${statusColor}77, 0 0 120px ${statusColor}44`,
                }}
              >
                {
                  /* Non-breaking space when idle: holds the line height so the
              layout doesn't jump when a real note appears, without the
              em-dash rendering as a glowing box. */
                }
                {noteName ?? " "}
                {noteName && <sup class="tt-note-oct">{octave}</sup>}
              </div>
              <div class="tt-note-status" style={{ color: statusColor }}>
                {status === "in-tune"
                  ? "IN TUNE"
                  : status === "flat"
                  ? `${Math.round(cents)}¢ flat`
                  : status === "sharp"
                  ? `+${Math.round(cents)}¢ sharp`
                  : active
                  ? "Finley's listening…"
                  : "Drop anchor to start tuning"}
              </div>
            </>
          )}
      </div>

      {/* Finley */}
      <div class="tt-finley">
        <svg viewBox="0 0 400 240" width="100%" height="100%" id="finley-svg">
          <Finley
            cents={cents}
            active={active}
            inTune={inTune}
            error={!!micError}
            palette={finleyPalette}
          />
        </svg>
      </div>

      {/* Freq readout */}
      <div class="tt-freq">
        <span class="tt-freq-num" id="depth-display">
          {freq != null ? freq.toFixed(1) : "—"}
        </span>
        <span class="tt-freq-unit">Hz</span>
      </div>
    </div>
  );
}

// ─── Bottom control bar ─────────────────────────────────────────
function ControlBar(
  { active, onToggle, gate, onGate, theme }: {
    active: boolean;
    onToggle: () => void;
    gate: number;
    onGate: (v: number) => void;
    theme: Theme;
  },
) {
  const gatePct = Math.round(gate * 100);
  return (
    <div class="tt-controls">
      <button
        type="button"
        class={"tt-anchor " + (active ? "is-active" : "is-idle")}
        onClick={onToggle}
        style={{
          background: active ? theme.btnActiveBg : theme.btnIdleBg,
          color: active ? theme.btnActiveText : theme.btnIdleText,
          borderColor: active ? theme.stateNeutral : theme.panelBorder,
          boxShadow: active
            ? `0 0 32px ${theme.stateNeutral}55`
            : `0 0 24px ${theme.btnIdleGlow}`,
        }}
      >
        <span class="tt-anchor-icon">
          {active
            ? (
              <svg
                viewBox="0 0 18 18"
                width="16"
                height="16"
                fill="currentColor"
              >
                <rect x="4" y="4" width="10" height="10" rx="2" />
              </svg>
            )
            : (
              <svg
                viewBox="0 0 18 18"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="9" cy="4.5" r="2" />
                <path d="M 9 6.5 V 14" />
                <path d="M 4 11 C 4 14, 6.5 16, 9 16 C 11.5 16, 14 14, 14 11" />
                <path d="M 6 9 H 12" />
              </svg>
            )}
        </span>
        <span
          class="tt-anchor-label"
          style={{ color: active ? "#ff8080" : "inherit" }}
        >
          {active
            ? "Drop Anchor — Finley's Listening"
            : "Drop Anchor · Tune with Finley"}
        </span>
        {!active && (
          <span
            class="tt-anchor-pulse"
            style={{ background: theme.stateNeutral }}
          />
        )}
      </button>
      <div class="tt-gate">
        <div class="tt-gate-head">
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill={theme.accentSoft}
          >
            <path d="M 2 12 C 4 8, 6 10, 8 6 C 10 10, 12 8, 14 12 L 14 14 L 2 14 Z" />
          </svg>
          <span class="tt-gate-title">Filter Out The Seaweed</span>
          <span class="tt-gate-val">{gatePct}%</span>
        </div>
        <input
          class="tt-gate-slider"
          type="range"
          min="0"
          max="100"
          value={gatePct}
          onInput={(e) =>
            onGate(Number((e.currentTarget as HTMLInputElement).value) / 100)}
          style={{ "--track-fill": theme.stateNeutral, "--val": `${gatePct}%` }}
        />
        <div class="tt-gate-sub">
          Noise gate — higher = quieter strings ignored
        </div>
      </div>
    </div>
  );
}

// ─── Dev simulator — drives Finley without sound; dev builds only ───
function DevSim(
  { sim, onSim, simEnabled, onSimToggle, theme }: {
    sim: number;
    onSim: (v: number) => void;
    simEnabled: boolean;
    onSimToggle: (v: boolean) => void;
    theme: Theme;
  },
) {
  return (
    <div class="tt-dev" style={{ borderColor: theme.panelBorder }}>
      <label class="tt-dev-toggle">
        <input
          type="checkbox"
          checked={simEnabled}
          onChange={(e) =>
            onSimToggle((e.currentTarget as HTMLInputElement).checked)}
        />
        <span
          class="tt-dev-toggle-track"
          style={{ "--on": theme.stateNeutral }}
        >
          <span class="tt-dev-toggle-thumb" />
        </span>
        <span class="tt-dev-label">Simulate</span>
      </label>
      <input
        class="tt-dev-slider"
        type="range"
        min="-50"
        max="50"
        step="0.5"
        value={sim}
        onInput={(e) =>
          onSim(Number((e.currentTarget as HTMLInputElement).value))}
        disabled={!simEnabled}
        style={{ "--track-fill": theme.stateNeutral, "--val": `${sim + 50}%` }}
      />
      <span class="tt-dev-readout" style={{ color: theme.stateNeutral }}>
        {sim > 0 ? "+" : ""}
        {sim.toFixed(1)}¢
      </span>
    </div>
  );
}

// ─── Main dashboard ─────────────────────────────────────────────
export default function TunaTuner(
  { defaultInstrument = "guitar" }: { defaultInstrument?: string },
) {
  const theme = OCEAN;
  const finleyPalette = OCEAN_FINLEY;

  const [instrument, setInstrument] = useState(defaultInstrument);
  const [active, setActive] = useState(false);
  const [gate, setGate] = useState(0.15);
  const [micError, setMicError] = useState<string | null>(null);

  const [simEnabled, setSimEnabled] = useState(false);
  const [sim, setSim] = useState(0);
  const [notation, setNotation] = useState<NoteNotation>("flats");

  const [tuning, setTuning] = useState("standard");

  // Reset tuning to standard when instrument changes
  const handleInstrumentChange = (key: string) => {
    setInstrument(key);
    setTuning("standard");
  };

  const [pinnedMidi, setPinnedMidi] = useState<number | null>(null);

  const gateRef = useRef(gate);
  useEffect(() => {
    gateRef.current = gate;
  }, [gate]);

  const [detected, setDetected] = useState<
    { freq: number | null; note: Note | null }
  >({ freq: null, note: null });
  const stopRef = useRef<(() => void) | null>(null);

  const targetMidi = useMemo(() => {
    if (pinnedMidi != null) return pinnedMidi;
    const inst = INSTRUMENTS[instrument];
    if (inst.tunings && inst.tunings[tuning]) {
      const strings = inst.tunings[tuning].strings;
      return stringMidi(strings[Math.floor(strings.length / 2)]);
    }
    return 69; // A4 for chromatic
  }, [instrument, tuning, pinnedMidi]);

  useEffect(() => {
    if (simEnabled) {
      const targetFreq = noteToFreq(targetMidi);
      const simFreq = targetFreq * Math.pow(2, sim / 1200);
      setDetected({
        freq: simFreq,
        note: {
          name: midiToNoteName(targetMidi),
          octave: Math.floor(targetMidi / 12) - 1,
          cents: sim,
          freqTarget: targetFreq,
          midi: targetMidi,
        },
      });
    }
  }, [sim, simEnabled, targetMidi]);

  // Mic lifecycle.
  useEffect(() => {
    if (!active || simEnabled) return;
    let stopped = false;
    (async () => {
      try {
        const stop = await startPitch(
          ({ freq, note }) => {
            if (stopped) return;
            if (freq > 0) setDetected({ freq, note });
            else setDetected((d) => ({ ...d, freq: null })); // dim
          },
          // Map the 0–1 "Filter Out The Seaweed" slider to an RMS threshold.
          () => gateRef.current * 0.08,
        );
        stopRef.current = stop;
        setMicError(null);
      } catch (_e) {
        setMicError(
          "Allow microphone access in your browser, then drop anchor again.",
        );
        setActive(false);
      }
    })();
    return () => {
      stopped = true;
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
    };
  }, [active, simEnabled]);

  // Keep the phone screen awake while the tuner is open (Screen Wake Lock
  // API). The lock drops whenever the page is hidden, so it is re-acquired
  // when the page becomes visible again.
  useEffect(() => {
    const wakeLock = (navigator as unknown as {
      wakeLock?: {
        request(type: "screen"): Promise<{ release(): Promise<void> }>;
      };
    }).wakeLock;
    if (!wakeLock) return; // unsupported

    let sentinel: { release: () => Promise<void> } | null = null;
    let released = false;

    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      wakeLock.request("screen").then((s) => {
        if (released) {
          s.release().catch(() => {});
        } else {
          sentinel?.release().catch(() => {});
          sentinel = s;
        }
      }).catch(() => {}); // a refused request (battery saver etc.) is harmless
    };

    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", acquire);
      sentinel?.release().catch(() => {});
    };
  }, []);

  const freq = detected.freq ?? null;
  const hasSignal = freq != null && freq > 0;

  // A pinned string overrides auto-detection: cents are measured against that
  // exact tone, so the deviation is unbounded — anything above it reads sharp,
  // anything below reads flat — instead of snapping to the nearest note.
  let noteName: string | null;
  let octave: number | null;
  let currentMidi: number | null;
  let cents: number;
  if (pinnedMidi != null) {
    noteName = midiToNoteName(pinnedMidi, notation);
    octave = Math.floor(pinnedMidi / 12) - 1;
    currentMidi = pinnedMidi;
    cents = freq != null && freq > 0
      ? 1200 * Math.log2(freq / noteToFreq(pinnedMidi))
      : 0;
  } else {
    noteName = detected.note?.midi != null
      ? midiToNoteName(detected.note.midi, notation)
      : null;
    octave = detected.note?.octave ?? null;
    currentMidi = detected.note?.midi ?? null;
    cents = detected.note ? detected.note.cents : 0;
  }

  // In-tune detection with hysteresis: held under ENTER for >300ms locks in;
  // the lock only releases past EXIT. Between the two, the current state holds.
  const [inTune, setInTune] = useState(false);
  useEffect(() => {
    if (!hasSignal) {
      setInTune(false);
      return;
    }
    const dev = Math.abs(cents);
    if (dev < IN_TUNE_ENTER) {
      const t = setTimeout(() => setInTune(true), 320);
      return () => clearTimeout(t);
    }
    if (dev > IN_TUNE_EXIT) {
      setInTune(false);
    }
    // Between ENTER and EXIT: hysteresis band — leave the lock as-is.
  }, [cents, hasSignal]);

  const status: Status = !hasSignal
    ? "idle"
    : inTune
    ? "in-tune"
    : cents > 5
    ? "sharp"
    : cents < -5
    ? "flat"
    : "in-tune";

  return (
    <div
      class="tt-shell"
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.font,
      }}
    >
      <div
        class="tt-caustics"
        style={{ background: theme.caustics }}
        aria-hidden="true"
      />
      <Header
        theme={theme}
        instrumentKey={instrument}
        tuning={tuning}
        notation={notation}
        onNotation={setNotation}
        onInstrument={(k) => {
          handleInstrumentChange(k);
          setPinnedMidi(null);
        }}
        onTuning={setTuning}
      />
      <StringRow
        tuning={tuning}
        instrumentKey={instrument}
        notation={notation}
        currentMidi={currentMidi}
        pinnedMidi={pinnedMidi}
        onPin={setPinnedMidi}
        theme={theme}
      />
      <AquariumView
        noteName={noteName}
        octave={octave}
        cents={cents}
        freq={freq}
        status={status}
        theme={theme}
        finleyPalette={finleyPalette}
        active={active || simEnabled}
        inTune={inTune}
        micError={micError}
      />
      <ControlBar
        active={active}
        onToggle={() => setActive((a) => !a)}
        gate={gate}
        onGate={setGate}
        theme={theme}
      />
      {/* Dev-only: rendered under `deno task dev`, stripped from prod builds. */}
      {import.meta.env.DEV && (
        <DevSim
          sim={sim}
          onSim={setSim}
          simEnabled={simEnabled}
          onSimToggle={setSimEnabled}
          theme={theme}
        />
      )}
    </div>
  );
}
