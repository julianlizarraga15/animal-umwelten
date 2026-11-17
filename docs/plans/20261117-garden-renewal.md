# Build the Garden of the Afternoon

## Goal and question

The user selected the generated Garden of the Afternoon concept and requested
implementation planning. Can we reproduce its warm, sheltered composition in a
real interactive browser scene, with clear flower and web lessons and acceptable
mobile performance?

[Selected concept](../art-direction/jardin-de-la-tarde.png). This AI-generated
image is an art-direction target, not a running product, an exact delivery
promise, or evidence of animal perception. This plan supersedes the completed
cozy-patio plan for future visual work. Implementation has not started.

## What must change visibly

Replace the isolated central pot and dominant empty wall with a layered garden.
Use a low camera, broad leaves framing the foreground, a narrow worn path,
a yellow flower to the left, and the web to the right. Terracotta and peach
architecture appear through planting. Amber sunlight and cooler foliage shadows
separate the subjects. The opening scene fills most of the viewport with minimal
controls and contextual explanations.

Preserve the reference's composition, palette, large silhouettes, and intimate
scale before fine texture detail. Flower hairs, dense tiny blossoms, depth of
field, and elaborate light shafts are optional refinements. The generated web
is not an anatomical target: preserve the horizontal web supported by the
existing research. Decorative species in the image are not sensory evidence.

## Smallest complete experiment

Build one real, static garden view with a curved foreground leaf cluster,
a remodeled hero flower, worn path, two pots, background planting, and afternoon
lighting. Include a visible horizontal web and minimal usable navigation.
Produce desktop and portrait-mobile captures beside the concept and old scene.
Do not expand the environment until this view demonstrates the intended change.
A screenshot pasted behind the existing scene does not satisfy this experiment.

## Delivery sequence

### 1. Establish composition and a baseline

Capture current overview, flower comparison, and web interaction with fixed
viewport sizes. Record browser, device, load size, draw calls, triangles, and
frame times during the same camera journey. Separate hardware measurements from
SwiftShader checks.

Block out the new composition with simple meshes in the real renderer. Place
foreground, subjects, and background as separate depth layers. Establish the
opening camera and short unobstructed routes to the flower and web. Create a
portrait composition rather than cropping away an interaction target. Record
poses so later asset and lighting comparisons are reproducible.

Deliverable: desktop and mobile blockout captures with both targets accessible.

### 2. Prove the asset pipeline with one leaf and one flower

Create a small reusable leaf family with curved silhouettes, underside materials,
and restrained surface variation. Remodel the flower for the close view, with
separate upper and lower petal surfaces and explicit upper-surface signal masks.
Compare actual browser renders against the reference before building more assets.

Retain procedural generation where it produces the desired shape. If hero forms
remain mechanical, author meshes in Blender and export GLB. First verify available
local authoring tools; Blender availability has not been established. Preserve
editable source files and a repeatable export procedure. Do not silently fall
back to low-quality placeholders if authoring tools are missing.

Store runtime assets locally, with sources and generation/export steps documented.
Record origin and license for any third-party asset. Purchased assets require a
separate purchase decision. Generated textures are candidates, not finished
materials: check tiling, UV seams, lighting baked into color, and close-view quality.

Deliverable: one convincing hero flower and leaf cluster in the browser, including
human-reference, explanatory-contrast, and reverse-petal captures.

### 3. Finish one garden frame

Build the worn path, irregular pots, and background foliage from the proven asset
family. Use shared materials and repeated geometry for distant plants. Spend
geometry on silhouettes close to the camera. Give the web a readable background.

Tune directional afternoon light, contact shading, material roughness, and
selective leaf translucency. Use baked shading only on static decoration where
it survives every intended camera view. Moving plants must not carry visibly
inconsistent baked shadows. Limit dynamic shadow casters before reducing hero
quality. Evaluate subtle atmosphere only after composition and light work.

Deliverable: old scene, reference, and new browser captures side by side. Assess
warmth, depth, shelter, subject clarity, and texture quality explicitly. Passing
functional tests alone is not visual acceptance. The user can judge this concrete
frame while independent asset and interaction work continues.

### 4. Integrate exploration and motion

Give the scene most of the viewport. Keep accessible DOM controls and contextual
Spanish prompts. Make the explanation and representation limits easy to find.
The illustrated concept's generic buttons are not a final interaction design.

Use short camera journeys that reveal the garden without clipping through leaves.
Keep camera and lighting stable during sensory comparison. Add a restrained bee
arrival/landing sequence as a visible character moment, and refine the spider's
existing success response. Treat these movements as artistic animation unless
new behavioral claims receive research support.

Consider gentle ambient foliage motion after measuring the static scene. Keep
one scheduler, stop work when the document is hidden, and provide a still reduced-
motion experience. The existing zero-idle-frame rule remains until explicitly
replaced by a documented ambient-motion policy and matching tests. In either
case, paused/reduced-motion views must settle and avoid unnecessary rendering.
Decorative movement must not reveal hidden prey or imitate the vibration cue.

Deliverable: complete overview-to-flower and overview-to-web journeys, with
keyboard, touch, return, cancellation, and reduced motion.

### 5. Validate and tune for delivery

Run `npm run typecheck`, `npm run build`, and `npm run check:browser`. Update
browser assertions for intended layout and motion changes while preserving
behavior checks. Inspect 1440x1000 desktop and 390x844 mobile views, both flower
representations, petal backs, web search and success, fallback, and context loss.
Keep new evidence under `test-results/patio/garden-renewal/`.

Provisional targets are a 30 fps floor on the selected physical phone and
60 fps on the selected desktop during the scripted journey. Record device,
viewport, pixel ratio, browser, warm-up, repeated frame-time samples, and loading
conditions. These are targets, not measured capability or universal guarantees.
Select a representative phone before asserting mobile performance. Report
transfer size and decoded texture cost before setting final asset budgets.

Tune pixel ratio, distant foliage, shadow resolution/casters, and optional effects
first. Retain subject silhouettes and sensory contrast on lower-quality settings.
Test actual cold loading and recovery if external assets introduce asynchronous
loading. Never present emulated touch or SwiftShader as physical-device evidence.

## Technical boundaries

Keep Three.js, TypeScript, Vite, one renderer, and existing interaction states.
`src/patio.ts` currently owns environmental geometry; `src/flower.ts` owns flower
geometry and view materials; `src/spider-web.ts` owns the web activity;
`src/main.ts` owns camera, lighting, scheduling, and integration. Rework those
responsibilities without a general-purpose scene framework. If asset loading is
needed, define its ready/error lifecycle before wiring user controls.

Do not force the new scene into the old camera poses, pot placement, or sidebar.
Preserve educational behavior while intentionally revising spatial composition.
Keep the documented contrast on upper petal surfaces. Background vegetation has
no invented UV mapping. Sources remain [bee vision](../research/bee-vision.md)
and [web vibrations](../research/spider-vibrations.md).

## Acceptance and open choices

The first milestone succeeds when the actual browser frame has the reference's
layered garden composition, warm palette, and legible subjects on desktop and
mobile. It must look substantially different from the current patio before
animation. Exact pixel parity with the generated image is not required.

Open implementation choices: procedural versus authored hero meshes, available
asset-authoring tools, initial human-reference versus contrast view, contextual
explanation layout, representative hardware, and whether ambient motion earns
its performance cost. Resolve these with rendered evidence and measured behavior;
do not treat current implementation convenience as an artistic constraint.

The scope is one polished garden and its existing two lessons. Additional animals,
free roaming, sound design, and new environments remain later work.

## Planning validation

Reviewed current project status, package scripts, scene ownership and lighting
hooks, latest saved patio capture, and the selected concept. No implementation,
new scientific claims, runtime checks, or performance measurements were made.
