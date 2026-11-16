# First perception experiment

Status: local experiment implemented and technically verified. User comprehension and physical-device checks remain open.

## Goal

Let a visitor explore one flower and compare a human reference view with an
illustrative representation of one signal available to a bee. Test whether the
comparison teaches a sensory difference and invites exploration.

## How to execute

Follow the installed pstack Prototype playbook for the exploratory comparison,
then Feature only if the experiment warrants further development. Keep the
experiment small; do not create a multi-PR program or a reusable perception engine.
The user subsequently authorized completing the local experiment. No separate approval is required within that scope.

Check each step only when its named evidence exists. Verify each unit before
starting the next, following sequence-verifiable-units. Use prove-it-works to
inspect the running interaction, rather than treating a successful build as proof.

## 1. Establish the scientific claim

- [x] Find primary sources for bee spectral sensitivity and floral UV patterns.
  Record source links, species, observations, and limitations in
  `docs/research/bee-vision.md`.
- [x] Choose one documented example, ideally a flower with a supported UV pattern.
  If its species or pattern cannot be supported, label the geometry and pattern
  as schematic; do not invent a measured reflectance map.
- [x] Write the intended lesson in one sentence and separate the biological claim
  from the display encoding. UV false color is a candidate encoding, not an
  assertion about what a bee subjectively sees.

Acceptance: every biological claim in the interface has a supporting source.
The brief explains that an ordinary display cannot reproduce bee perception.
Avoid compound-eye mosaics, arbitrary global color filters, and unsupported blur.

Research outcome is in [bee vision](../research/bee-vision.md). Use a schematic
*Rudbeckia hirta* UV pattern with *Apis mellifera* as the sensory reference.
Draft copy has sources. The eventual interface still needs a claim audit.

## 2. Choose the smallest browser stack

- [x] Check current official documentation for Three.js with TypeScript and Vite,
  React Three Fiber, and browser export constraints of Godot and Unreal.
- [x] Compare only what matters here: local setup, camera controls, material changes,
  browser delivery, and complexity of one scene. Record the conclusion in
  `DECISIONS.md` without implementing four versions.
- [x] Prefer Three.js + TypeScript + Vite unless the comparison reveals a concrete
  obstacle. React, a backend, Blender assets, and a larger engine need an actual
  requirement before inclusion.

Acceptance: one short decision explains the chosen stack and what would justify
revisiting it. No technology is treated as selected until this step is complete.

Selected Three.js + TypeScript + Vite with npm. The comparison, official sources,
and conditions for reconsideration are in [Decisions](../../DECISIONS.md).
Setup and browser behavior were verified in step 3 and the automated browser check.

## 3. Render one inspectable flower

- [x] Add the selected tooling and documented install, dev, typecheck, and build
  commands. Use the package manager lockfile.
- [x] Build a flower with basic geometry, a neutral ground, lighting, and an orbit
  camera. Fit the initial framing to the flower. Do not build a garden.
- [x] Verify local startup, camera orbit, zoom limits, and viewport resize in a real
  browser. Save a screenshot and record browser and viewport.

Acceptance: the flower is immediately visible, camera movement is usable, and
resize preserves the subject. The console has no application errors.

## 4. Compare two representations

- [x] Add labeled HTML controls for human reference and bee signal representation.
  Keep the same scene, camera, geometry, and lighting when switching.
- [x] Encode only the researched signal. If two visual encodings are plausible,
  compare them temporarily in the same scene before retaining the clearer one.
- [x] Show a short explanation and a source link alongside the controls. Label
  false colors and schematic patterns explicitly. Write initial UI copy in Spanish.
- [x] Support keyboard activation and a visible selected state. Keep controls
  readable and usable at narrow and desktop viewport sizes.

Acceptance: repeated switching changes the intended pattern without moving the
camera or duplicating the scene. A visitor can identify what changed and why.

## 5. Verify and review the experiment

- [x] Run typecheck and production build. Add automated tests only for meaningful
  behavior with a cheap, clear test target; do not test Three.js internals.
- [x] Drive orbit, zoom, repeated switching, keyboard controls, and resize in the
  running browser. Save comparable screenshots of both modes and a short recording.
- [x] Check the research brief against every explanatory label and visual claim.
- [ ] Observe responsiveness on the actual browser and record the device and any
  visible stalls. Investigate measured problems before adding optimizations.
- [ ] Present the running result for user review. Ask whether the signal difference
  is understandable and whether exploring it feels worthwhile. Do not claim that
  technical checks establish educational value.
- [x] Update `PROJECT_STATUS.md` with commands, evidence, remaining uncertainty,
  and the next small experiment. Record settled choices in `DECISIONS.md`.

Acceptance: report technical results and user feedback separately. If the lesson
is unclear, revise the encoding or explanation before adding animals or scenery.
No deployment or merge is needed to evaluate the local prototype.

## Candidate structure

Use only the files needed by the selected stack. For the Three.js candidate:

```text
index.html
package.json
package-lock.json
tsconfig.json
src/
  main.ts       # Scene, flower, camera, rendering, and mode switching initially.
  style.css     # Page and controls.
docs/
  research/bee-vision.md
```

The initial state is one selected mode, human or bee-signal. Keep mode switching
local. Split a module only when actual code makes its purpose clear. Do not add
animal registries, sensory pipelines, state libraries, or plugin interfaces.

## Scope boundaries

No navigation through a large world, animated animal, game mechanics, additional
senses, custom models, accounts, backend, deployment, or general-purpose engine.
A single flower is an experiment to evaluate, not a permanent product constraint.

## Risks and exit decision

Scientific evidence may support a narrower claim than the desired effect. Narrow
the lesson rather than embellishing the effect. A beautiful toggle may still
teach little; user comprehension is the main unresolved product question.

Continue only after reviewing the comparison. Choose one next action from the
observed result: improve the lesson, improve exploration, or try a different
sensory example. Do not expand the backlog automatically.

## Local validation evidence

`npm run typecheck` and `npm run check:browser` pass. The latter builds production
assets and drives Chromium 159.0.8154.6 on Linux with software WebGL. Captures at
1440x1000 and 390x844, the interaction recording, and metadata are in
`test-results/flower/`. Keyboard elevation, unchanged backs, zoom bounds,
WebGL context restoration, and browser-emulated touch/pinch are also covered.
The retained encoding is violet bases with yellow tips. Trial palettes are removed.

No hardware responsiveness or physical mobile test was performed. The build
emits a bundle-size advisory. User feedback and educational value remain open.
The local server is ready for user review, with no deployment or PR.
