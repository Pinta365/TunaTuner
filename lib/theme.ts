// theme.ts

export interface FinleyPalette {
  id: string;
  body: string;
  bodyDark: string;
  belly: string;
  fin: string;
  accent: string;
  eye: string;
  outline: string;
}

export interface Theme {
  id: string;
  name: string;
  font: string;
  bg: string;
  caustics: string;
  text: string;
  panelBg: string;
  panelBorder: string;
  aquariumInner: string;
  bubble: string;
  accentSoft: string;
  stateNeutral: string;
  stateFlat: string;
  stateSharp: string;
  stateIn: string;
  logoFish: string;
  btnIdleBg: string;
  btnIdleText: string;
  btnIdleGlow: string;
  btnActiveBg: string;
  btnActiveText: string;
}

export const OCEAN: Theme = {
  id: "ocean",
  name: "Ocean Deep",
  font: "Manrope, system-ui, sans-serif",
  bg:
    "radial-gradient(ellipse at 50% 0%, #0f3a5f 0%, #0c1f3a 45%, #060f1f 100%)",
  caustics: `
    radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.10) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 70%, rgba(56,189,248,0.08) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 110%, rgba(8,47,73,0.7) 0%, transparent 50%)`,
  text: "#dceeff",
  panelBg: "rgba(15, 32, 56, 0.55)",
  panelBorder: "rgba(34, 211, 238, 0.22)",
  aquariumInner: "rgba(34, 211, 238, 0.06)",
  bubble: "#7dd3fc",
  accentSoft: "#22d3ee",
  stateNeutral: "#22d3ee", // cyan-400
  stateFlat: "#38bdf8", // sky-400
  stateSharp: "#fb923c", // orange-400
  stateIn: "#34d399", // emerald-400
  logoFish: "#22d3ee",
  btnIdleBg: "rgba(34, 211, 238, 0.06)",
  btnIdleText: "#bdf1ff",
  btnIdleGlow: "rgba(34, 211, 238, 0.18)",
  btnActiveBg: "rgba(34, 211, 238, 0.18)",
  btnActiveText: "#e9fbff",
};

// Ocean-blue tuna palette for Finley.
export const OCEAN_FINLEY: FinleyPalette = {
  id: "ocean",
  body: "#1e6dad",
  bodyDark: "#0b3a66",
  belly: "#c7e2f4",
  fin: "#2a8fd6",
  accent: "#fbbf24",
  eye: "#0b1e33",
  outline: "#05182b",
};

export interface GuitarString {
  name: string;
  octave: number;
}

export interface Tuning {
  label: string;
  strings: GuitarString[];
}

export interface Instrument {
  label: string;
  tunings: Record<string, Tuning> | null;
}

export type NoteNotation = "flats" | "sharps";

export const INSTRUMENTS: Record<string, Instrument> = {
  guitar: {
    label: "Guitar",
    tunings: {
      standard: {
        label: "Standard",
        strings: [
          { name: "E", octave: 2 },
          { name: "A", octave: 2 },
          { name: "D", octave: 3 },
          { name: "G", octave: 3 },
          { name: "B", octave: 3 },
          { name: "E", octave: 4 },
        ],
      },
      drop_d: {
        label: "Drop D",
        strings: [
          { name: "D", octave: 2 },
          { name: "A", octave: 2 },
          { name: "D", octave: 3 },
          { name: "G", octave: 3 },
          { name: "B", octave: 3 },
          { name: "E", octave: 4 },
        ],
      },
      half_step: {
        label: "Half Step Down",
        strings: [
          { name: "E♭", octave: 2 },
          { name: "A♭", octave: 2 },
          { name: "D♭", octave: 3 },
          { name: "G♭", octave: 3 },
          { name: "B♭", octave: 3 },
          { name: "E♭", octave: 4 },
        ],
      },
      open_g: {
        label: "Open G",
        strings: [
          { name: "D", octave: 2 },
          { name: "G", octave: 2 },
          { name: "D", octave: 3 },
          { name: "G", octave: 3 },
          { name: "B", octave: 3 },
          { name: "D", octave: 4 },
        ],
      },
    },
  },
  bass: {
    label: "Bass",
    tunings: {
      standard: {
        label: "Standard",
        strings: [
          { name: "E", octave: 1 },
          { name: "A", octave: 1 },
          { name: "D", octave: 2 },
          { name: "G", octave: 2 },
        ],
      },
      drop_d: {
        label: "Drop D",
        strings: [
          { name: "D", octave: 1 },
          { name: "A", octave: 1 },
          { name: "D", octave: 2 },
          { name: "G", octave: 2 },
        ],
      },
      half_step: {
        label: "Half Step Down",
        strings: [
          { name: "E♭", octave: 1 },
          { name: "A♭", octave: 1 },
          { name: "D♭", octave: 2 },
          { name: "G♭", octave: 2 },
        ],
      },
    },
  },
  ukulele: {
    label: "Ukulele",
    tunings: {
      standard: {
        label: "Standard",
        strings: [
          { name: "G", octave: 4 },
          { name: "C", octave: 4 },
          { name: "E", octave: 4 },
          { name: "A", octave: 4 },
        ],
      },
      low_g: {
        label: "Low G",
        strings: [
          { name: "G", octave: 3 },
          { name: "C", octave: 4 },
          { name: "E", octave: 4 },
          { name: "A", octave: 4 },
        ],
      },
    },
  },
  chromatic: { label: "Chromatic", tunings: null },
};

export const NOTE_NAMES_FLAT = [
  "C",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];

export const NOTE_NAMES_SHARP = [
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

// Default app notation is flats.
export const NOTE_NAMES = NOTE_NAMES_FLAT;

const NOTE_INDEX_BY_NAME: Record<string, number> = {
  C: 0,
  "C♯": 1,
  "D♭": 1,
  "C#": 1,
  Db: 1,
  D: 2,
  "D♯": 3,
  "E♭": 3,
  "Eb": 3,
  "D#": 3,
  E: 4,
  F: 5,
  "F♯": 6,
  "G♭": 6,
  "Gb": 6,
  "F#": 6,
  G: 7,
  "G♯": 8,
  "A♭": 8,
  "Ab": 8,
  "G#": 8,
  A: 9,
  "A♯": 10,
  "B♭": 10,
  "Bb": 10,
  "A#": 10,
  B: 11,
};

export const midiToNoteName = (
  midi: number,
  notation: NoteNotation = "flats",
): string => {
  const names = notation === "sharps" ? NOTE_NAMES_SHARP : NOTE_NAMES_FLAT;
  return names[((midi % 12) + 12) % 12];
};

export const stringMidi = (s: GuitarString): number =>
  (NOTE_INDEX_BY_NAME[s.name] ?? NOTE_NAMES.indexOf(s.name)) +
  (s.octave + 1) * 12;

export const noteToFreq = (midi: number): number =>
  440 * Math.pow(2, (midi - 69) / 12);
