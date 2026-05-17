// Finley.tsx — the charming tuna SVG.
import { type FinleyPalette, OCEAN_FINLEY } from "../lib/theme.ts";

interface FinleyProps {
  cents?: number;
  active?: boolean;
  inTune?: boolean;
  error?: boolean;
  palette?: FinleyPalette;
}

export default function Finley(
  { cents = 0, active = false, inTune = false, error = false, palette }:
    FinleyProps,
) {
  const p = palette || OCEAN_FINLEY;
  const t = Math.max(-1, Math.min(1, cents / 50));
  const flat = t < -0.08;
  const sharp = t > 0.08;

  // Body tilt / translate based on cents.
  const tilt = inTune ? 0 : t * 14; // degrees
  const shiftX = inTune ? 0 : t * 18;
  const shiftY = flat ? Math.abs(t) * 6 : 0; // flat = slumps down

  const tailClass = inTune
    ? "finley-tail-celebrate"
    : sharp
    ? "finley-tail-fast"
    : active
    ? "finley-tail-slow"
    : "finley-tail-idle";

  // Whole-fish wrapper
  const wrapClass = inTune
    ? "finley-celebrate"
    : sharp
    ? "finley-shake"
    : "finley-bob";

  // Mouth — woozy wobble on mic error, otherwise driven by tuning state.
  const mouthState = error
    ? "open"
    : inTune
    ? "grin"
    : sharp
    ? "open"
    : flat
    ? "frown"
    : "smile";

  // Eye expression
  const eyeOpen = inTune
    ? 1
    : sharp
    ? 1.1
    : flat
    ? Math.max(0.35, 1 - Math.abs(t) * 0.7)
    : 1;

  // One consistent cartoon outline weight across body + fins.
  const stroke = { stroke: p.outline, "stroke-width": 3 } as const;

  return (
    <>
      <defs>
        <linearGradient id={`finley-body-${p.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={p.bodyDark} />
          <stop offset="55%" stop-color={p.body} />
          <stop offset="100%" stop-color={p.belly} />
        </linearGradient>
        <radialGradient id={`finley-glow-${p.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#34d399" stop-opacity="0.55" />
          <stop offset="60%" stop-color="#34d399" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#34d399" stop-opacity="0" />
        </radialGradient>
      </defs>

      <ellipse
        cx="200"
        cy="120"
        rx="196"
        ry="116"
        fill={`url(#finley-glow-${p.id})`}
        class={"finley-halo " + (inTune ? "is-on" : "is-off")}
      />

      <g
        class={wrapClass}
        style={{
          transform: `translate(${shiftX}px, ${shiftY}px) rotate(${tilt}deg)`,
          transformOrigin: "200px 120px",
          transition: "transform 180ms cubic-bezier(.4,1.4,.5,1)",
        }}
      >
        {/* Tail fin */}
        <g class={tailClass} style={{ transformOrigin: "70px 120px" }}>
          <path
            d="M 70 120 L 18 78 L 30 120 L 18 162 Z"
            fill={p.bodyDark}
            {...stroke}
            stroke-linejoin="round"
          />
          <path
            d="M 70 120 L 28 92 L 38 120 L 28 148 Z"
            fill={p.fin}
            opacity="0.85"
          />
        </g>

        {/* Anal fin (bottom) */}
        <path
          d="M 195 165 Q 220 188 248 168 Q 232 162 215 162 Z"
          fill={p.bodyDark}
          {...stroke}
          stroke-linejoin="round"
        />
        {/* Dorsal fin (top) */}
        <path
          d="M 205 78 Q 235 50 258 72 Q 240 74 222 78 Z"
          fill={p.bodyDark}
          {...stroke}
          stroke-linejoin="round"
        />

        {/* Main body */}
        <path
          d="
          M 352 120
          C 348 70, 250 62, 188 76
          C 122 88, 90 104, 70 118
          L 60 120
          L 70 122
          C 90 136, 122 152, 188 164
          C 250 178, 348 170, 352 120
          Z"
          fill={`url(#finley-body-${p.id})`}
          {...stroke}
          stroke-linejoin="round"
        />

        {/* Lateral stripe (tuna marking) */}
        <path
          d="M 90 122 C 150 124, 240 124, 270 122"
          stroke={p.outline}
          stroke-width="2"
          fill="none"
          opacity="0.4"
        />

        {/* Yellow finlets */}
        <g
          fill={p.accent}
          stroke={p.outline}
          stroke-width="1.2"
          stroke-linejoin="round"
          opacity="0.95"
        >
          <path d="M 100 102 L 105 96 L 110 104 Z" />
          <path d="M 115 100 L 120 94 L 125 102 Z" />
          <path d="M 100 140 L 105 146 L 110 138 Z" />
          <path d="M 115 142 L 120 148 L 125 140 Z" />
        </g>

        {/* Gill arc */}
        <path
          d="M 282 95 Q 274 120 282 148"
          stroke={p.outline}
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Pectoral fin */}
        <path
          d="M 250 138 Q 268 168 290 152 Q 278 142 262 138 Z"
          fill={p.fin}
          {...stroke}
          stroke-linejoin="round"
        />

        {/* Eye socket */}
        <ellipse
          cx="313"
          cy="108"
          rx="16"
          ry="17"
          fill={p.bodyDark}
          opacity="0.35"
        />
        {/* Eye white */}
        <ellipse
          cx="313"
          cy="108"
          rx="13"
          ry={13 * eyeOpen}
          fill="#fff"
          stroke={p.outline}
          stroke-width="2"
          style={{ transition: "ry 200ms" }}
        />
        {error
          ? (
            /* Dizzy spiral — woozy eye for the mic-error state. */
            <path
              class="finley-dizzy"
              d="M 315 108 A 2.5 2.5 0 0 1 313 111 A 3.5 3.5 0 0 1 309 108 A 4.5 4.5 0 0 1 313 103 A 5.5 5.5 0 0 1 319 108 A 6.5 6.5 0 0 1 313 115 A 7.5 7.5 0 0 1 305 108 A 8.5 8.5 0 0 1 313 99"
              fill="none"
              stroke={p.eye}
              stroke-width="2.6"
              stroke-linecap="round"
            />
          )
          : (
            <>
              {/* Pupil */}
              <ellipse
                class="finley-pupil"
                cx="315"
                cy="108"
                rx="6.5"
                ry={6.5 * eyeOpen}
                fill={p.eye}
                style={{ transition: "ry 200ms" }}
              />
              {/* Shine */}
              <circle
                cx="317"
                cy="105"
                r="2.4"
                fill="#fff"
                opacity={eyeOpen > 0.7 ? 1 : 0}
              />
              {/* Blink lid — sweeps shut from the top via CSS. */}
              <ellipse
                class="finley-lid"
                cx="313"
                cy="108"
                rx="14"
                ry="14"
                fill={p.body}
              />
            </>
          )}

        {/* Mouth — cheek-mounted; one variant shown via the data-mouth attr. */}
        <g
          class="finley-mouth"
          data-mouth={mouthState}
          stroke={p.outline}
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path class="m-smile" d="M 319 129 Q 332 138 345 129" />
          <path class="m-frown" d="M 319 134 Q 332 125 345 134" />
          <path class="m-open" d="M 319 131 q 4.3 -5 8.6 0 t 8.7 0 t 8.7 0" />
          <path
            class="m-grin"
            d="M 318 127 Q 332 132 346 127 Q 344 145 332 145 Q 320 145 318 127 Z"
            fill={p.outline}
          />
        </g>

        {/* Sweat drop when very sharp */}
        <g
          class={"finley-sweat-wrap " +
            (sharp && Math.abs(t) > 0.5 ? "is-on" : "is-off")}
        >
          <path
            class="finley-sweat"
            d="M 295 70 Q 290 80 295 86 Q 300 80 295 70 Z"
            fill="#7dd3fc"
            stroke="#0369a1"
            stroke-width="0.8"
          />
        </g>
      </g>
    </>
  );
}
