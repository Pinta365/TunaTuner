<p align="center">
  <img src="static/favicon.svg" width="200" alt="TunaTuner logo" />
</p>

# TunaTuner

A browser-based instrument tuner — meet **Finley the tuna**, who reacts live to
your pitch. Built with [Fresh](https://fresh.deno.dev/) (Deno + Preact).

## Features

- Real-time pitch detection from the microphone — autocorrelation DSP, no audio
  dependencies
- Big note-name display with octave and live cents-deviation bar
- Finley the tuna animates to the tuning state: flat, sharp, or in tune
- Instrument presets: Guitar, Bass, Ukulele, Chromatic
- Note-notation toggle: display note names as flats or sharps (same pitch)
- Adjustable noise gate — "Filter Out The Seaweed"

## Develop

Install [Deno](https://docs.deno.com/runtime/getting_started/installation),
then:

```
deno task dev
```

Open the printed local URL, click **Drop Anchor**, and grant microphone access.

## Build & run

```
deno task build
deno task start
```

## Project layout

- `routes/` — Fresh routes; `index.tsx` renders the tuner
- `islands/TunaTuner.tsx` — the interactive dashboard, hydrated client-side
- `components/Finley.tsx` — the animated tuna SVG
- `lib/pitch.ts` — autocorrelation pitch detection and note math
- `lib/theme.ts` — palette, instrument presets, helpers
- `assets/tuna-tuner.css` — dashboard styles

A `deno task dev`-only **Simulate** slider drives Finley without sound for
development; it is stripped from production builds.
