# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

- `deno task dev` — Vite dev server (serves on http://localhost:5173).
- `deno task build` — production build into `_fresh/`.
- `deno task start` — serve the production build. Works as-is; do not "fix" the
  `_fresh/server.js` path even though it looks like it mismatches the build
  output — it has been confirmed working.
- `deno task check` — `deno fmt --check` + `deno lint` + `deno check`. Run this
  before considering a change done.
- `deno task update` — update the Fresh framework.

There is no test suite in this repo.

Note: bare `deno fmt` also reformats markdown docs. Scope it to code when
formatting your own changes, e.g. `deno fmt islands components lib routes`.

## Architecture

A browser instrument tuner built on **Fresh 2** (Deno + Preact + Vite). It was
implemented from a Claude Design handoff bundle; of the design's three palettes
only **"Ocean Deep"** shipped.

**The entire UI is one island.** `routes/index.tsx` renders
`islands/TunaTuner.tsx`, and that single island holds the whole dashboard. All
interactivity — mic lifecycle, the simulate slider, in-tune detection, all state
— lives there and runs client-side. The sub-components in that file (`Header`,
`StringRow`, `AquariumView`, `ControlBar`, `DevSim`, `Bubbles`) are plain
components, not separate islands; they bundle into the one island automatically.

Key modules:

- `lib/pitch.ts` — autocorrelation pitch detection + frequency→note math.
  `start()` uses `getUserMedia`/`AudioContext`, so it is **browser-only**: call
  it only from effects, never during SSR.
- `lib/theme.ts` — the shipped "Ocean Deep" palette, instrument presets, and
  note/MIDI helpers.
- `components/Finley.tsx` — the animated tuna SVG, rendered inside the island's
  `<svg viewBox="0 0 400 240">`. Keep added shapes within that viewBox or they
  get clipped; the in-tune halo is deliberately outside the animated `<g>` so
  the celebrate animation can't push it past the viewBox edge.

Styling: `assets/tuna-tuner.css` is the whole dashboard (plain CSS, `tt-`
prefixed, responsive media queries at the bottom). `assets/styles.css` is just
`@import "tailwindcss"` — its preflight reset is the global layout baseline.
Both are loaded via imports in `client.ts`, not `<link>` tags.

## Behaviors that aren't obvious from a single file

- **Mic-first.** "Drop Anchor" starts the real microphone. The "Simulate" slider
  (`DevSim`) is a dev tool, gated on `import.meta.env.DEV` — it is stripped from
  production builds entirely.
- The noise-gate slider feeds `pitch.ts` through a ref-polled getter (`gateRef`)
  so dragging it adjusts sensitivity live without tearing down and restarting
  the mic stream.
- `Bubbles` generates its specs in a post-mount `useEffect`, not in render —
  `Math.random()` during render would cause an SSR/hydration mismatch.
- The microphone requires HTTPS when not on `localhost` (matters for testing on
  a real device — use a tunnel or Vite HTTPS).
- z-index only works on positioned elements; the design's CSS has several
  `static` elements with inert `z-index` — `.tt-header` needs an explicit
  `position` for the Tackle Box dropdown to layer above the aquarium.
