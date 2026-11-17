# Project status

Handoff updated: 2026-11-17

## Goal and current state

Umwelt Explorer lets visitors explore a shared patio and compare two bounded
animal-relevant signals. A schematic *Rudbeckia hirta* flower carries a bee UV
contrast encoding. A horizontal spider web offers a vibration-direction
interaction inspired by research on *Uloborus diversus*. The interface is in
Spanish. Neither representation claims literal animal subjective experience.

The spider increment and cozy patio atmosphere pass are complete. No deployment
was performed. See `docs/plans/20261117-cozy-patio.md`.

## Completed increment

- Reviewed plan: `docs/plans/20261117-spider-web.md`. Scientific evidence and
  display limits: `docs/research/spider-vibrations.md`.
- `src/spider-web.ts` owns web/spider/insect geometry, four numbered sectors,
  and explicit exploration/search/found and pulse/static states.
- `src/main.ts` retains one renderer and RAF scheduler, with flower and web
  destinations, return/cancel, contextual controls and lessons, and scene hits.
- Visitors touch different web points or use numbered buttons, summon a hidden
  fly, follow a directional cue, retry, replay, and start another round.
  Human/vibration switching preserves the camera and round. Finding the fly
  reveals it; leaving or losing WebGL context resets the activity.
- Reduced motion shows static cues. Midpulse preference changes settle them.
  The app stops scheduling frames after travel and bounded pulse playback.
- Independent plan and code reviews resolved a mobile heading overlap and a
  context-loss verification timing gap. One owner wrote in an isolated worktree;
  the reviewed implementation was copied byte-for-byte into this checkout.

## Validation

On 2026-11-17, Linux, Node v22.23.1, Chromium 159.0.8154.6, SwiftShader:

- `npm ci`, `npm run typecheck`, and `npm run build` passed. Build retains the
  existing Vite advisory for the Three.js chunk larger than 500 kB.
- `npm run check:browser` passed in this shared checkout with zero page/console
  errors and external requests. This host required existing Chromium libraries
  through `LD_LIBRARY_PATH=/tmp/umwelt-browser-libs/extracted/usr/lib/x86_64-linux-gnu`.
- Existing bee approach/cancel/return, fixed-pose UV toggles, keyboard,
  reverse-petal equality, fallback, touch, and WebGL recovery checks pass.
- Web tests cover actual overview and sector scene clicks, distinct cues,
  keyboard and emulated touch including drag rejection, hidden prey, wrong and
  correct guesses, replay/new rounds, modes, reduced-motion changes, leaving,
  and context loss during pulse/search/travel.
- Five settled checks record unchanged RAF and WebGL draw counters. Real
  context-loss probes hold test-only RAF timestamps to keep pulses/travel
  active until the asynchronous event. Production timing is unchanged.
- Desktop 1440x1000 and mobile 390x844 web control bars end at 985.84px and
  788.38px. No horizontal overflow or sampled occluders. Final captures inspected.
- Evidence: `test-results/patio/verification.json`, `interaction.webm`,
  `web-vibrations-desktop.png`, `web-vibrations-mobile.png`, and
  `web-found-human-desktop.png`. Historical flower/visual-quality evidence is
  preserved. `git diff --check` passed.

## Limits and next actions

1. Ask 1–3 visitors to explain the two signals and what the colors/pulses mean.
2. Check controls and readability on a physical phone. Emulated touch does not
   establish physical-device usability or hardware WebGL performance.
3. Configure static hosting when requested so visitors can test outside the
   local development environment. No hosting has been configured.

Web geometry, camera, sector count, palette, pulse speed, and hidden insect are
teaching choices. The experiment does not model calibrated wave mechanics or
active spider sensing. Patio surfaces carry no animal-vision maps. Primary
sources, settled choices, and later candidates remain in `docs/research/`,
`DECISIONS.md`, and `BACKLOG.md`.

## Latest discussion

Implemented the cozy patio plan (`docs/plans/20261117-cozy-patio.md`):

- Compared `afternoon` (warm late-afternoon sun, peach plaster, violet-tinted
  shadow fill) and `shade` (cooler diffused light) static treatments; selected
  `afternoon` as the default lighting.
- Added peach plaster, warm clay tiles, worn terracotta, a feathered wall water
  stain, a repaired companion pot with seam and staples, a sage sprout between
  tiles, and a curved foreground leaf in `src/patio.ts`.
- Added smoother quintic camera easing and brief bounded plant sway on travel
  arrival in `src/main.ts`, plus a restrained spider step/orientation upon
  finding the fly in `src/spider-web.ts`. All motion settles completely and
  respects `prefers-reduced-motion`.
- Re-ran `npm run typecheck` and `npm run check:browser` on Windows (Node
  v24.14.0, Playwright Chromium SwiftShader); all desktop (1440x1000), mobile
  (390x844), reduced-motion, touch, reverse-petal, context-loss, and idle
  RAF/draw-counter checks passed with zero errors and zero external requests.

Next actions:

1. Ask 1–3 visitors to explore both signals in the updated patio and explain what
   the colors and pulses represent.
2. Check controls and WebGL performance on a physical phone.
3. Configure static hosting when ready to share externally.
