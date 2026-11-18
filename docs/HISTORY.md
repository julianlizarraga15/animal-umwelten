# History

## 2026-11-18: Authored Rudbeckia specimen

Modeled a Rudbeckia head and broad leaf in code: thick overlapping rays, a
floret-covered dark disk, phyllaries, a hairy stem, and a folded, veined leaf
with a visible edge. A material pass added ray striations, transmitted-light
glow, instanced hairs, and leaf texture. Captures beside the concept pass in
close and oblique views. The specimen stays in the isolated page. No garden
integration, commit, or deployment.

## 2026-11-18: Isolated flower and leaf model test

Compared a Poly Haven syngonium and a CC0 Grab3D sunflower in a specimen page,
outside the garden. Browser captures rejected both for the afternoon concept:
thin glossy leaves without a flower, or solid but simple petals and leaves.
No garden integration, commit, or deployment.

## 2026-11-17: Full-viewport garden iteration

Added overlay navigation, a modal scientific lesson, responsive camera framing,
more procedural planting, and a revised flower silhouette. The initial view is
human reference. Preserved the art reference, plans, and independent critique.
This iteration remains below the artistic target; foreground occlusion and asset
quality require further work. The user requested saving this state to main.


## 2026-11-17: Afternoon garden opening

Replaced the isolated patio composition with a garden frame: flower and pot to
the left of a worn path, horizontal web to the right, peach house and window
behind, and a bee that arrives only with the flower camera. Upper-petal UV
contrast, web sectors, reduced motion, and the idle-frame rule stay in place.
The bee is described as a scene character, not a flight model. Typecheck, build,
and the Chromium browser suite passed on Windows with SwiftShader. The back wall
is still more open than the generated concept. No physical phone, visitor study,
or deployment.

## 2026-11-17: Interactive spider web in the shared patio

Added a second camera destination with a schematic horizontal web, spider, and
four numbered sectors. Visitors can create directional vibration graphics and
locate a hidden fly, with human-reference comparison, retry, replay, new rounds,
keyboard and touch equivalents, and static reduced-motion cues. Contextual
lessons cite the new primary-source research brief and state rendering limits.

Independent plan and code reviews resolved a mobile heading overlap and a
context-loss test timing gap. Typecheck, production build, and the extended
Chromium browser suite pass in the shared checkout. Existing bee checks remain
green. Browser evidence in `test-results/patio/` includes desktop/mobile web
captures and five stable idle RAF/draw checks. No physical phone, hardware GPU
timing, visitor comprehension study, deployment, or PR was performed. The user
subsequently requested committing and pushing the completed increment to main.

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
