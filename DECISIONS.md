# Decisions

## 2026-11-18: Refine canopy leaves and human ray color

Give the upper canopy a low-resolution curved blade and a central vein. Keep
its shadows off the flower and pot, as in the earlier canopy pass. The smaller
blade reduces the scene by about 2,000 triangles and 28 draw calls. Shift the
human ray base from burnt orange to warm gold so it reads closer to the lesson's
description of both regions as yellow. The UV guide colors stay unchanged.

## 2026-11-18: Use the authored Rudbeckia and broad leaf in the garden

The garden flower is now the accepted specimen head, scaled ×32 onto a new
stem, with three basal broad leaves in the pot. The UV view swaps a second
vertex-color set on the rays. Only upper faces change: a violet basal guide
and yellow distal region. Backs keep human colors, as before (Schlangen et
al., 2009; Horth et al., 2014). The flat frame and collar leaves gave way to
modeled broad leaves in the lower corners.

Garden leaves keep 25% of the specimen's 7,100 hairs per leaf. On an Intel
UHD GPU (hardware WebGL, 1456×819), frame time with and without hairs stayed
within run-to-run noise (8.5–11 ms overview). At garden distance, 25% keeps the fuzzy rim that full density
gives. Removing hairs leaves a plastic edge. The reduction saves about 300k
triangles. Most of the added cost is the leaf blades themselves.

## 2026-11-18: Author the hero flower and leaf in code

Stop searching catalogs. Free CC0 plants were either alpha-masked shells or
low-detail game props. Build the Rudbeckia head and broad leaf procedurally
as closed surfaces with real thickness, and review them in the isolated
specimen page under the garden's unchanged afternoon rig. A tinted
translucency term adds sunlight transmitted through petals and leaves.
The term ignores each tissue's own shadow, so a back face still glows.
Fine hairs are instanced cones that do not cast shadows.

Ray and leaf widths follow the concept, not Flora of North America. The
review note records both. See the
[botanical model review](docs/art-direction/botanical-model-review.md).

## 2026-11-18: Keep the tested flower and leaf models out of the garden

Poly Haven `potted_plant_02` and the Grab3D sunflower were loaded in an isolated
specimen page and captured under afternoon light. The syngonium has a usable
terracotta pot and broad leaves, but the leaves are thin glossy shells and
there is no flower. The sunflower has solid petals and a visible back, but the
head and leaves stay simple and smooth. Neither approaches
`docs/art-direction/jardin-de-la-tarde.png`. They remain available for
comparison and are not part of the garden scene. See the
[botanical model review](docs/art-direction/botanical-model-review.md).

## 2026-11-17: Require visual acceptance of the garden frame

The user finds the implemented renewal substantially short of the selected
concept and requests a qualitative leap. Prioritize full-viewport framing,
layered vegetation, authored-quality hero assets, and filtered light. Assess
explicit visual criteria against actual browser captures before expanding motion.
Passing functional checks cannot stand in for that judgment. The
[art-quality plan](docs/plans/20261117-garden-art-quality.md) supersedes the previous
renewal plan. Its proposed ambient-motion policy remains unimplemented.


## 2026-11-17: Build the afternoon garden in the existing scene modules

The renewal stays in `src/patio.ts`, `src/flower.ts`, `src/spider-web.ts`, and
`src/main.ts`. Hero forms are procedural meshes, not imported models. The new
opening camera looks across the flower toward the path and web. The bee is an
artistic character: it moves only during the flower approach and rests
afterward, including under reduced motion. Garden surfaces still have no
animal-vision map. The generated image is not a delivery target for pixel
parity. See the [garden renewal plan](docs/plans/20261117-garden-renewal.md).

## 2026-11-17: Use Garden of the Afternoon as the renewal target

The user selected the generated afternoon concept after finding the cozy pass
visually too similar to the old scene. Plan a substantial composition and asset
renewal, with one real browser frame as the first milestone. Preserve the two
educational interactions while allowing new camera poses and interface layout.
Keep Three.js. The concept establishes artistic intent, not exact visual parity
or measured device capability. See the
[garden renewal plan](docs/plans/20261117-garden-renewal.md).

## 2026-11-17: Select warm late-afternoon lighting and bounded cozy patio motion

After comparing the warm late-afternoon (`afternoon`) and cooler shaded
(`shade`) static treatments on the same composition, `afternoon` is now the
default lighting: low-angle warm sun (`0xffe0b2`) with peach plaster walls,
worn terracotta, sage foliage, and restrained violet-tinted ground fill
(`0x6d617a`) gives the patio depth while preserving flower UV signal contrast
and web readability.

Added three handmade details (repaired companion pot with lime seam and metal
staples, feathered mineral water stain on the plaster wall, and a sage sprout
between tiles) plus a curved foreground leaf, smoother quintic camera travel,
brief bounded plant sway on travel arrival, and a short spider step/orientation
toward the found fly. All motion settles completely and respects
`prefers-reduced-motion`. See [the cozy patio plan](docs/plans/20261117-cozy-patio.md).

## 2026-11-17: Establish the cozy garden through a static scene first

The user selected a warm, inviting garden direction and requested a plan.
Use Journey as an atmospheric reference, while developing an original patio.
Establish composition, palette, and light before adding motion so animation
reinforces a scene that already has character. Rendering choices remain
tentative until visual comparison. See the
[cozy patio plan](docs/plans/20261117-cozy-patio.md).

## 2026-11-17: Add web-borne vibrations in the shared patio

Keep one scene and add a second camera destination for a schematic horizontal
spider web. Independent design exploration and plan review favored a bounded
web module over a second renderer or a generic animal framework. `main.ts`
retains DOM, camera, and animation scheduling; the web owns geometry and a typed
exploring/searching/found interaction.

Use four numbered locations for touching the web and guessing where a fly is
caught. During searching, hide the insect in both representations. Reveal it
on success. This is a teaching choice, not a claim about spider eyesight.
Colors and slowed pulses explain vibration direction. They do not reproduce
subjective experience or calibrated mechanics. Reduced motion keeps a static
directional cue. Leaving the web clears the interaction.

The [research brief](docs/research/spider-vibrations.md) cites experimental work
on *Uloborus diversus*. The [reviewed plan](docs/plans/20261117-spider-web.md)
records acceptance criteria and rejected ownership alternatives.

## 2026-11-16: Retain directional daylight for the visual-quality scene

Treatment B uses a lower fill-to-key ratio and raking sunlight from camera right.
At the desktop flower pose, it reduced crushed pixels from 3.64% under Treatment
A to 1.48% while keeping the violet fraction within 1% of Treatment A. Image
review also showed clearer shadow separation between overlapping petal cups.

Set `directional` as `DEFAULT_LIGHTING`. A small emissive lift on the dark disk
florets then reduced candidate crushed pixels to 0.27% on desktop and 0.49% on
mobile. Candidate clipped pixels remain 0%. The visible violet/yellow encoding
is unchanged and remains an explanatory display choice.

Use deterministic field-generated textures and merged two-faced lamina geometry.
The adaxial material alone accepts the selected view texture. The abaxial
material has no view-dependent input, which keeps the documented UV guide off
the petal backs.

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

## 2026-11-18: Keep authored-asset evidence separate from the lesson

Use the CC0 Gazania study to evaluate imported geometry and texture maps. It
improves botanical detail but remains below the reference and is not Rudbeckia.
Keep it isolated from the scientific lesson until a suitable hero asset and
lighting pass visual review. See the authored-asset study review.
