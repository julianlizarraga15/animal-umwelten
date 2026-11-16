# History

## 2026-11-16: Naturalistic flower and patio upgrade

Rebuilt the flower as deterministic curved laminae with upper-only UV textures,
venation, two attached leaves, a receptacle, and 610 instanced disk florets.
Rebuilt the pot as an open lathe profile with a mounded soil surface and 90 soil
clods. Added procedural patio surface maps with no external assets.

Compared soft and directional daylight in matching Chromium captures. Retained
directional daylight because it separated overlapping petals and reduced dark
pixel clipping. Moved the view selector below the scene and fitted the complete
scene bar in the first screen at 1440x1000 and 390x844.

`npm run typecheck`, `npm run build`, and `npm run check:browser` pass. The
browser check includes first-screen bounds, viewport occlusion, reverse-face
mode equality, renderer statistics, and the existing interaction coverage.

## 2026-11-16: Bee patio implementation

Implemented `docs/plans/20261116-bee-patio.md`: placed the schematic
*Rudbeckia hirta* flower in a potted patio corner (`src/patio.ts`), replaced
orbit/zoom with stationary first-person look-around, added raycasted
click/tap-to-approach and HTML equivalents ("Acercarse a la flor", "Volver al
patio"), started in UV contrast mode with human reference toggle, honored
`prefers-reduced-motion`, and updated Spanish perceptual limit copy.

Typecheck, production build, and `npm run check:browser` pass on Chromium
159.0.8154.6 with SwiftShader software WebGL. Evidence is saved under
`test-results/patio/` while preserving `test-results/flower/`. User comprehension
review remains open.

## 2026-11-16: Bee patio plan

Recorded the user's priority of perception over gameplay. Planned a small patio,
first-person inspection, one selectable flower approach, and a stable comparison
of human reference with the documented bee-relevant UV signal. Kept camera choices
separate from sensory evidence. No patio implementation started.

## 2026-11-16: Local flower experiment

Built one schematic flower with orbit, bounded zoom, keyboard camera controls,
reset, and human/UV mode selection. Added Spanish explanations, scientific links,
representation limits, and WebGL failure recovery. Selected violet bases with
yellow tips after inspecting trial palettes in the browser.

Typecheck and production build pass. Automated Chromium checks exercise desktop
and narrow layouts, repeated toggles with exact restored rendering, petal backs,
keyboard controls, mouse orbit, zoom limits, simulated touch/pinch, and WebGL
failure and context restoration. Screenshots and a recording are saved locally
under `test-results/flower/`. No deployment or educational validation performed.
## 2026-11-16: Browser stack selected

Completed the official-documentation comparison of Three.js, React Three Fiber,
Godot, and Unreal. Selected Three.js with TypeScript, Vite, and npm for one scene
and HTML controls. Recorded tradeoffs and reconsideration criteria in
`DECISIONS.md`. Verified local Node and npm availability. No dependencies or
application code added.

## 2026-11-16: First scientific brief

Completed the first research step with primary sources for honeybee spectral
sensitivity and the floral UV pattern of *Rudbeckia hirta*. Recorded one lesson,
schematic rendering limits, and sourced draft Spanish copy in
`docs/research/bee-vision.md`. No application code or stack selection yet.

## 2026-11-16

Initialized the repository workflow from watering-system conventions. Preserved
the user's exploratory project brief, added planning and handoff support, and
recorded the existing environment-level pstack availability.

Expanded the first-experiment plan without implementing the prototype. The user
clarified that prehistoric ecosystems are an unrelated project; removed that
idea from this project's backlog. Saved a handoff distinguishing the published
initial commit from subsequent local documentation changes.
