# Project status

Handoff updated: 2026-11-16

## Goal and scope

Build Umwelt Explorer, an exploratory experience about animal perception inspired
by Ed Yong's *An Immense World*. The active increment places the schematic
*Rudbeckia hirta* flower in a small patio corner explored from a first-person
viewpoint, starting with a bee-relevant UV contrast signal and a human
reference for comparison, without claiming subjective animal vision.

## Completed

- Scientific brief in `docs/research/bee-vision.md` separates primary evidence,
  inference, display encoding, and representation limits.
- Stack comparison selected Three.js, TypeScript, Vite, and npm in `DECISIONS.md`.
- Implemented the patio corner (`src/patio.ts`: tiled floor, corner stucco walls
  with plinth and coping, terracotta pot with soil) around the existing
  schematic flower (`src/flower.ts`, preserving upper-only basal UV contrast).
- Replaced `OrbitControls` in `src/main.ts` with a four-state first-person
  camera controller (`patio`, `approaching`, `flower`, `returning`):
  - Stationary yaw/pitch look-around via pointer/touch drag, directional HTML
    buttons, and canvas arrow keys without translating the camera.
  - Click/tap on the flower (distinguished from drag via 6 px threshold) or
    "Acercarse a la flor" button starts one predetermined approach to the upper
    petals; duplicate requests during travel are ignored.
  - "Volver al patio" cancels active travel or returns to the patio viewpoint.
  - `prefers-reduced-motion: reduce` snaps immediately without an animation loop.
  - WebGL context loss stops travel and resets cleanly to `patio` so
    interrupted travel cannot resume unexpectedly upon restoration.
- Updated Spanish copy in `index.html` and `src/style.css`: starts in
  `Contraste UV` mode with `Referencia humana` toggle, explicitly separating
  camera/travel choices and non-modeled patio surroundings from the floral UV
  signal.
- Updated `scripts/verify-browser.mjs`, `README.md`, `AGENTS.md`, `DECISIONS.md`,
  and `docs/HISTORY.md`.

## Current stopping point

Implementation of `docs/plans/20261116-bee-patio.md` (Steps 1–5) is complete
and verified locally. Remaining item in the plan is presenting the running
result for user comprehension review before researching a second animal.

Changes are committed to `main` and pushed to `origin/main`. No deployment
was performed.

## Decisions and limits

- *Apis mellifera* is the sensory reference and *Rudbeckia hirta* is the
  schematic floral pattern; their pairing is illustrative, not a behavioral test.
- Pattern extent, geometry, and visible false colors (violet bases, yellow tips)
  are explanatory encodings, not bee subjective colors or measured reflectance.
- Patio walls, floor, and pot are spatial context only and carry no UV maps.
- Initial camera position, FOV, look limits, and approach duration are
  interaction choices, not measured bee optics or body scale.
- Educational clarity and physical-device responsiveness remain untested.

## Validation

On 2026-11-16 (Windows 10/11, Node v24.14.0, npm 11.9.0):
- `npm ci` succeeded.
- `npm run typecheck` (`tsc --noEmit`) passed with 0 errors.
- `npm run build` (`tsc --noEmit && vite build`) passed (with Vite's existing
  >500 kB chunk-size advisory for Three.js).
- `npm run check:browser` passed on Chromium 159.0.8154.6 with SwiftShader
  software WebGL, 0 console/page errors:
  - Initial `uv` mode in `patio` state on 1440x1000 desktop and 390x844 mobile
    (no horizontal overflow).
  - Keyboard and pointer-drag look-around without triggering approach.
  - Drag-vs-click raycast distinction, click-on-flower approach, mid-travel
    cancellation, and return to patio.
  - Fixed-pose comparison at the flower across 5 `uv` / `human` toggle cycles
    with exact restored rendering, plus keyboard radio selection.
  - `prefers-reduced-motion: reduce` immediate endpoint snap.
  - WebGL context loss during travel (resets cleanly to `patio`, disables
    controls, recovers cleanly on restoration) and forced WebGL initialization
    failure fallback with accessible source links.
  - Browser-emulated touch tap approach/return and touch-drag look-around
    (no physical mobile device tested).
- Evidence saved in `test-results/patio/` (`patio-uv-desktop.png`,
  `flower-uv-desktop.png`, `flower-human-desktop.png`, `patio-uv-mobile.png`,
  `flower-uv-mobile.png`, `webgl-fallback.png`, `interaction.webm`,
  `verification.json`). `test-results/flower/` is preserved as historical
  baseline evidence.

## Next actions

1. Present the local patio experience (`npm run dev` at `http://localhost:5173/`)
   for user review and ask what signal changed, where it changed, and what the
   colors mean.
2. Revise Spanish explanation/visual framing if comprehension feedback reveals
   ambiguity.
3. Only after comprehension is confirmed, research a specific second-animal
   signal before planning a second animal.
