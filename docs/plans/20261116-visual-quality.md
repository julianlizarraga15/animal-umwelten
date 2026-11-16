# Improve the flower and patio presentation

Implemented and merged to `main` on 2026-11-16.

The directional treatment won because matching captures showed clearer petal
separation and fewer crushed pixels than the soft treatment. The final candidate
passes the first-screen layout, reverse-face, deterministic toggle, external
asset, typecheck, build, and browser checks. Hardware WebGL performance and
visitor comprehension remain open.

## Question

Can a small, naturalistic scene make the flower worth inspecting while keeping
the human-reference and UV comparison clear? Improve the existing experience
without rebuilding the application or expanding the patio.

## Scope and direction

Retain Three.js, TypeScript, Vite, one flower, one pot, and one patio corner.
Use restrained naturalism with botanical detail concentrated on the flower.
Keep Spanish product copy. Make the scene the main part of the page.

The current screenshots show repeated petal silhouettes, angular color boundaries,
a uniformly colored pot, and a sparse background. These are visual-review
observations, not performance measurements. Existing shadows and tone mapping
already work; adding effects alone is not the proposed solution.

Execute as small local Prototype and Feature increments through the installed
pstack plugin. This is not a multi-PR program. No engine migration, deployment,
new navigation system, or mandatory approval between reversible steps is needed.
Planning is the current task; implementation starts on a subsequent request.

## Smallest experiment

Improve only the flower at the existing inspection pose, the pot immediately
behind it, and the lighting. Compare the current rendering with two treatments:

- A. Botanical geometry and restrained surface detail under soft daylight.
- B. The same geometry and materials under more directional daylight.

Keep camera and UV encoding identical between treatments. Capture each in human
and UV modes. Choose the treatment that shows petal curvature and separation
without hiding the basal contrast. Test a narrow viewport before extending it.
If neither improves the flower, revise geometry and materials before adding effects.

The trials selected directional daylight over the softer treatment.

## 1. Preserve a reproducible baseline

- [x] Record the starting commit and working-tree changes.
- [x] Save current desktop and mobile captures at patio and flower poses, in both
  modes. Preserve historical evidence in `test-results/flower/`.
- [x] Save baseline and candidate captures in separate subdirectories under
  `test-results/patio/visual-quality/`, with matching viewport, camera, and mode.
- [x] Record browser, rendering backend, viewport, pixel ratio, transferred asset
  bytes, and geometry draw statistics. Record capture procedures with evidence.

Acceptance. A reviewer can compare the same view before and after. Do not use
historical screenshots with different settings as a performance baseline.

## 2. Make the flower hold up at close range

Work primarily in `src/flower.ts`. Keep `createFlower()` and `setView()` usable
by existing callers. Keep geometry and surface detail identical between modes.

- [x] Add curved petal profiles, subtle veins, thickness or a convincing reverse,
  and bounded, deterministic variation in length, angle, and droop. Avoid random
  changes on reload or mode selection.
- [x] Replace the oval leaf with a shaped blade and visible attachment to the stem.
  Refine the dark central disk without increasing detail uniformly everywhere.
- [x] Represent the basal boundary independently from coarse geometry groups if
  needed. Keep its extent schematic and its underside separate.
- [x] Inspect the silhouette from both camera endpoints and during approach.
  Remove visible gaps, sharp color triangles, clipping, and distracting overlap.
- [x] Run the two lighting treatments from the smallest experiment. Retain one
  and record its comparison captures and reason.

Acceptance. The close view shows curved, distinct petals and a coherent leaf.
The UV boundary follows the petal surface without coarse triangular steps.
The underside does not inherit the upper basal pattern. Switching modes restores
exactly the same human-reference rendering under the same conditions.

## 3. Give materials depth without enlarging the environment

Work in `src/patio.ts` and the lighting setup in `src/main.ts`.

- [x] Add restrained terracotta variation, a readable pot opening, granular soil,
  and subtle wall and floor surface detail. Fix the pot silhouette if necessary.
- [x] Tune ambient fill and directional light together. Preserve contact shadows
  and visible petal detail without washed-out yellows or crushed dark regions.
- [x] Add an environment map only if the comparison shows a useful improvement.
  Do not add bloom, depth-of-field blur, or an always-running wind animation.
- [x] Add at most a few contextual details with a stated compositional purpose.
  Keep the flower discoverable from the initial pose.

Acceptance. The pot reads as hollow and planted. Materials differ visibly at
normal viewing distance. The patio supports orientation without competing with
the floral signal. The camera path does not cross the revised geometry.

## 4. Put the experience ahead of the editorial framing

Work in `index.html` and `src/style.css`. Change camera framing only as needed.

- [x] Reduce the oversized introduction and give the viewport more of the first
  screen. Use direct Spanish instructions tied to the visible interaction.
- [x] Keep comparison and approach controls easy to find. On mobile, place the
  mode control beside or immediately adjacent to the scene in reading order.
- [x] Keep the false-color explanation near the selector. Keep detailed limits
  and scientific sources available without dominating the primary action.
- [x] Retain keyboard equivalents, visible focus, touch targets, live travel
  status, and reduced-motion behavior.

Acceptance. At 1440x1000 and 390x844, the initial viewport and a usable comparison
control are visible without scrolling past a large introduction. No horizontal
overflow, overlapping controls, or text that obscures the flower is present.

## 5. Verify and present the complete result

- [x] Run `npm run typecheck`, `npm run build`, and `npm run check:browser`.
- [x] Extend `scripts/verify-browser.mjs` only where the new layout or rendering
  requires it. Keep approach, cancel, return, drag-versus-click, keyboard, touch,
  reduced motion, WebGL fallback, and context recovery coverage.
- [x] Inspect human and UV captures at both endpoints and the petal reverse.
  Check fixed-pose mode restoration and deterministic rendering.
- [x] Record new asset transfer bytes and draw statistics under the baseline
  conditions. Investigate increases before adding optional effects.
- [ ] On hardware WebGL, compare approach frame timing at baseline and candidate
  with the same browser and device. If hardware is unavailable, state that limit.
  Software WebGL screenshots do not establish mobile performance.
- [x] Present matching before/after captures and a short approach-and-toggle
  recording. Keep aesthetic feedback separate from technical test results.
- [ ] Ask the visitor what changed between modes, where it changed, and what the
  colors mean. Record absent feedback as untested comprehension.
- [x] Update `PROJECT_STATUS.md`, `DECISIONS.md`, and `docs/HISTORY.md` with actual
  results. Record remaining work in `BACKLOG.md`.

Acceptance. Technical checks pass, visual evidence covers desktop and mobile,
and known device limitations are explicit. Aesthetic improvement requires image
review; scientific comprehension requires visitor feedback.

## Asset policy and provisional budget

Prefer procedural improvements for the first flower trial. If they cannot provide
the required shape, evaluate one glTF flower before adopting an asset pipeline.
Check species suitability, petal editability, material separation, license,
redistribution rights, and close-up quality. A generic daisy is not automatically
an acceptable replacement for the schematic Rudbeckia.

Store retained assets locally under `public/assets/` with provenance and license
notes. Use small tiled material maps before large unique textures. Start with a
provisional ceiling of 5 MB of additional transferred assets, excluding the
existing application. This is a scope constraint, not a measured speed guarantee.
If it is exceeded, resize, compress, or remove assets before increasing the budget.
Do not depend on remote texture services at runtime.

## Preserve the evidence boundary

Use [the existing scientific brief](../research/bee-vision.md). This increment
introduces no new perceptual claims. Naturalistic appearance remains an artistic
choice. False colors represent the documented upper-petal contrast, not measured
reflectance or subjective bee colors. Do not derive UV maps from RGB textures or
apply animal-vision filters to the whole patio. New scientific claims need sources
before implementation.

## Unresolved choices and fallback

- Exact daylight treatment is decided by the two browser trials, not by this plan.
- Procedural versus imported flower depends on close-up quality and editability.
  Retain procedural geometry if an imported asset compromises the UV separation.
- Keep the existing violet/yellow encoding initially. Revisit only if revised
  lighting makes it unreadable, using matching captures and the existing brief.
- Hardware performance and visitor comprehension remain unmeasured.

## Deferred scope

Additional animals, more destinations, free flight, large gardens, photorealistic
scanning, audio, game mechanics, and engine migration remain outside this change.
The order of effort is flower quality, materials and light, then interface polish.
