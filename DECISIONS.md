# Decisions

## 2026-11-16: Replace orbit with first-person patio look and one flower approach

Implemented `docs/plans/20261116-bee-patio.md` by adding `src/patio.ts` (tiled
floor, corner stucco walls with plinth/coping, and terracotta pot) and replacing
`OrbitControls` in `src/main.ts` with a four-state camera controller (`patio`,
`approaching`, `flower`, `returning`).

- Pointer/touch drag rotates yaw/pitch in place without translating the camera;
  clicks/taps under the 6 px drag threshold raycast against `flower.root` to
  trigger the automatic approach.
- Start in `'uv'` mode so the documented bee-relevant contrast is immediately
  visible on load, with `'human'` reference selectable at any stationary or
  traveling pose without changing camera pose, lighting, or surroundings.
- Patio geometry provides spatial context only and carries no UV maps.
- Reduced-motion preference snaps immediately between `PATIO_POSE` and
  `FLOWER_POSE` without starting a `requestAnimationFrame` loop; WebGL context
  loss cancels any active travel and resets to `patio` so interrupted travel
  cannot resume unexpectedly.

## 2026-11-16: Prioritize perception in the patio increment

The user clarified that conveying animal perception is the main goal. Enjoyment,
gameplay, and flight complexity are secondary. Use a small shared patio as the
context, starting with the bee. Destination selection is the preferred movement
candidate, with no manual piloting required now.

The [patio plan](docs/plans/20261116-bee-patio.md) proposes a first-person camera,
one automatic flower approach, and a stable human-reference/bee-signal comparison.
Camera placement is an interaction choice, separate from the sourced sensory
encoding. Dog, mouse, and a third-person introduction are not part of this increment.
Control details and educational clarity still need evaluation in the browser.

## 2026-11-16: Keep the UV pattern on upper petal surfaces

Use a small flower factory to own the schematic geometry and its upper basal and
distal material groups. A separate uniform back-facing material prevents the
basal pattern from appearing on the reverse. The two-mode union keeps selection
explicit. Camera and lights remain outside this boundary and never change on
mode selection.

Compared violet/cream and charcoal/cyan palettes in the same running scene.
Pale tips blended into the ground. Retain violet bases with yellow tips to keep
the flower outline visible. These are explanatory colors, not bee colors or
measured reflectance. The temporary palette selector was removed.

Use system fonts so opening the page does not require a font service. Render on
camera, mode, or size changes, with no idle animation. Include vertical camera
buttons so the reverse is also inspectable with the keyboard.

Enable Vite file polling for the Windows-mounted WSL checkout after observing
stale transformed modules following disk edits. This follows the documented
[WSL watcher limitation](https://vite.dev/config/server-options.html#server-watch).
The current dev server was checked against subsequent source changes.

## 2026-11-16: Use Three.js, TypeScript, and Vite

Select Three.js with TypeScript, Vite, and npm for the first browser experiment.
One scene needs geometry, orbit and zoom, material changes, and HTML controls.
Direct Three.js covers those needs without a framework or an engine export step.
This is a scope judgment, not a measured performance advantage.

Official documentation checked on 2026-11-16 supports this comparison.

| Option | Setup, camera, and materials | Browser delivery and tradeoff |
| --- | --- | --- |
| Three.js, TypeScript, Vite | Vite offers a `vanilla-ts` template. Three.js provides OrbitControls and editable material colors. | Vite builds static assets. Retains direct control of a single scene and HTML interface. Selected. |
| React Three Fiber | Adds a React renderer over Three.js. React and Fiber major versions must match. | Works with Vite. Useful for a React application, but this project has no existing React interface to integrate. |
| Godot | Requires an editor project and web export templates. Camera interaction and material changes would live in that project. | Stable web export requires WebAssembly and WebGL 2 with the Compatibility renderer. Single-thread export avoids the isolation headers needed by threaded exports. Viable, but the experiment does not require an engine editor. |
| Unreal | Requires an engine project and packaging workflow for camera interaction and materials. | 5.9 Preview introduces experimental WebAssembly and WebGPU support. Pixel Streaming is a separate option that renders remotely and adds services. Neither workflow earns its setup for this scene. |

Sources for the comparison are [Vite setup](https://vite.dev/guide/),
[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html),
[material color](https://threejs.org/docs/pages/MeshStandardMaterial.html),
[R3F installation](https://r3f.docs.pmnd.rs/getting-started/installation),
[Godot web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html),
[Unreal 5.9 Preview release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-9-release-notes),
and [Pixel Streaming](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-pixel-streaming-in-unreal-engine).

Keep the initial implementation in `src/main.ts` and `src/style.css`, with one
scene and ordinary HTML controls. Add an explicit typecheck command because
[Vite transpiles TypeScript without checking types](https://vite.dev/guide/features.html#typescript).
Package versions and browser compatibility still need validation during setup.
Local Node v22.23.1 meets Vite's documented Node 22.12+ requirement. npm 12.2.1
is available. No dependencies were installed or application checks run here.

Revisit R3F if a substantial React interface becomes a real requirement. Revisit
an engine if scene authoring, assets, or native delivery become central to a later
experiment. A demonstrated browser limitation also warrants reconsideration.

## 2026-11-16: Isolate floral UV contrast

Use *Apis mellifera* as the sensory reference and a schematic *Rudbeckia hirta*
floral head for the first comparison. Primary sources document UV-sensitive bee
receptors and a contrast between UV-absorbing petal bases and reflecting tips.
This supports one bounded lesson without inventing a whole animal view.

The [research brief](docs/research/bee-vision.md) separates evidence, inference,
and proposed display encoding. False colors explain a signal, not subjective
experience. Exact palette and pattern proportions remain tentative. The rendering
stack is selected in the subsequent decision above.

## 2026-11-16: Preserve a small, resumable workflow

Adapt the adjacent watering-system's documentation conventions and reuse the
existing handoff skill. Keep pstack installed at the environment level and
record model preferences in `AGENTS.md`.

Avoid copying hardware operations, deployment instructions, credentials, or
historical project state. No rendering stack or application architecture is
selected yet.
