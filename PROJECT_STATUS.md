# Project status

Handoff updated: 2026-11-16

## Goal and scope

Build Umwelt Explorer, an exploratory experience about animal perception inspired
by Ed Yong's *An Immense World*. The active experience places a naturalistic
schematic *Rudbeckia hirta* flower in a small patio corner explored from a
first-person viewpoint, starting with a bee-relevant UV contrast signal and a
human reference for comparison, without claiming subjective animal vision.

## Completed

- Scientific brief in `docs/research/bee-vision.md` separates primary evidence,
  inference, display encoding, and representation limits.
- Stack comparison selected Three.js, TypeScript, Vite, and npm in `DECISIONS.md`.
- Implemented the first-person patio corner (`src/patio.ts`, `src/flower.ts`,
  `src/main.ts`) with stationary look-around, raycasted flower approach, cancel
  and return controls, `prefers-reduced-motion` support, and WebGL failure and
  context-loss recovery.
- Completed and merged the visual-quality upgrade
  (`docs/plans/20261116-visual-quality.md`):
  - Added deterministic field-generated `DataTexture` utilities (`src/procedural.ts`)
    with zero external asset downloads (`0 B`).
  - Rebuilt `src/flower.ts` with merged two-faced curved petal laminae, smooth
    per-texel adaxial UV basal guide and venation, view-independent abaxial
    backs, receptacle cup, 610 instanced disk florets, and two attached leaves.
  - Rebuilt `src/patio.ts` with an open hollow `LatheGeometry` pot, darkened
    inner terracotta wall, UV-mapped mounded soil, 90 instanced soil clods, and
    procedural tile, plaster, and trim maps.
  - Selected `directional` daylight (`DEFAULT_LIGHTING`) over `soft` after
    browser comparison captures (`test-results/patio/visual-quality/`).
  - Compacted `index.html` and `src/style.css` so `#viewport` and the complete
    scene control bar fit inside the first screen at `1440x1000` and `390x844`.
  - Extended `scripts/scene-page.mjs`, `scripts/capture-visual-quality.mjs`, and
    `scripts/verify-browser.mjs` with first-screen, occluder, reverse-face,
    `renderer.info`, and zero-external-asset assertions.

## Current stopping point

`feat/visual-quality` is merged into `main` and pushed to `origin/main`. The
local Vite development server on port `5173` was stopped after the user verified
live operation in the browser. No public deployment has been configured.

## Decisions and limits

- *Apis mellifera* is the sensory reference and *Rudbeckia hirta* is the
  schematic floral pattern; their pairing is illustrative, not a behavioral test.
- Pattern extent, naturalistic geometry, and visible false colors (violet bases,
  yellow tips) are explanatory encodings, not bee subjective colors or measured
  reflectance.
- Adaxial petal material alone receives `View`; abaxial backs and patio walls,
  floor, pot, and soil carry no UV maps.
- Directional daylight is the default rig (`DECISIONS.md`).
- Camera poses, FOV, look limits, and travel durations remain interaction
  choices, not measured bee optics or body scale.

## Open questions and blockers

- External visitor comprehension of the UV contrast lesson remains untested.
- Quantitative frame-time profiling on hardware WebGL and physical phones
  remains unmeasured (automated checks use SwiftShader software WebGL).
- A second animal in the shared patio (such as dog olfaction/vision or mouse
  perception) has no primary-source research brief yet.

## Validation

On 2026-11-16 (Windows 10/11, Node v24.14.0, npm 11.9.0):
- Live local verification: user ran the app via `npm run dev` (`http://localhost:5173/`)
  and confirmed working behavior in the local browser.
- `npm run typecheck` (`tsc --noEmit`) passed with 0 errors.
- `npm run build` (`tsc --noEmit && vite build`) passed.
- `npm run check:browser` passed on Chromium 159.0.8154.6 with SwiftShader
  software WebGL, 0 console/page errors:
  - First screen (`scrollY = 0`): at `1440x1000`, viewport, selector, and scene
    bar end at `834.84`, `912.84`, and `922.84 px`; at `390x844`, they end at
    `656.38`, `724.38`, and `843.38 px`, with `0` horizontal overflow and `0`
    viewport occluders.
  - Render statistics (`renderer.info`): `32` draw calls, `65,378` triangles,
    `16` geometries, and `15` textures at patio pose (down from `94` baseline
    draw calls), with `0 B` external image, font, or 3D model transfers.
  - Reverse inspection (`/?pose=reverse`): UV and human canvases are byte-equal
    with `0` violet pixels; flower pose shows `0%` clipped pixels and `0.41%`
    desktop / `0.72%` mobile crushed pixels.
  - Look-around, drag-vs-click raycast, approach, cancel, return, 5 fixed-pose
    mode cycles, keyboard radios, reduced motion, emulated touch, WebGL fallback,
    and context-loss recovery all pass.
- Evidence saved in `test-results/patio/` and `test-results/patio/visual-quality/`
  while preserving historical `test-results/flower/`. Skipped: quantitative
  hardware GPU frame-timing benchmark and external visitor comprehension study.

## Next actions

1. Research primary scientific sources for one bounded perceptual signal of a
   second animal in the same patio (`docs/research/`) before planning UI or scene
   changes.
2. Collect comprehension feedback from 1-3 external visitors (what changed,
   where it changed, and what the false colors represent).
3. Optional: configure static hosting (such as GitHub Pages) when ready to test
   and share outside the local network.
