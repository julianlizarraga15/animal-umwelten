# Local flower experiment

## Question and smallest experiment

Can one inspectable schematic flower make the documented floral UV contrast
understandable? Complete the existing plan locally with Three.js, TypeScript,
Vite, and native Spanish HTML controls. No deployment or remote changes.

## Shape

`main.ts` owns renderer, camera, controls, resize, and DOM events. `flower.ts`
owns geometry and upper basal/distal materials behind `createFlower()` returning
`{ root, setView(view) }`. `View` is `'human' | 'uv'`. Mode changes never rebuild
the scene or move the camera. Reverse surfaces have their own uniform material.
No animal engine, state library, image assets, or backend.

Caller sketch is `const flower = createFlower(); scene.add(flower.root);` followed
by `flower.setView('human')` or `flower.setView('uv')` from native radio controls.

Three design sketches compared a single file, a flower factory, and a scene
controller. The independent cross-judge favored the factory for front/back
ownership and keyboard camera controls. Use indexed geometry groups for upper
base and tip materials, plus a separate back-facing material. Reject a lifecycle
controller and shader mask because they hide no necessary additional complexity.
The factory is a small deviation from the original single-file candidate, justified
by keeping the evidence-sensitive surface assignment in one place.

## Acceptance and validation

- One flower is visible immediately on desktop and narrow viewports.
- Orbit, bounded zoom, reset, keyboard controls, resize, and repeated mode changes
  work. Mode changes preserve the camera. No application console errors.
- The upper petal bases and tips have a visible explanatory contrast. Reverses
  do not acquire the basal map. Geometry, extent, and colors remain schematic.
- Explanation, legend, sources, and representation limits remain readable.
- WebGL failure leaves a readable Spanish explanation instead of a blank page.
- Typecheck and production build pass. A rerunnable browser check exercises the
  real page and saves comparable screenshots and a short recording.

Compare two temporary palettes at the same camera, then remove the losing option.
Technical verification cannot establish user comprehension. That remains for the
user to judge after opening the result.

## Unresolved choices

Exact palette and framing will be chosen from browser inspection. Dependency
versions will be locked during setup. No performance claims without measurement.
