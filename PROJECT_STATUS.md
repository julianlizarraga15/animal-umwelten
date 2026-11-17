# Project status

Handoff updated: 2026-11-17

## Goal and current state

Umwelt Explorer lets visitors explore one afternoon garden and compare two
bounded animal-relevant signals. A schematic *Rudbeckia hirta* flower carries a
bee UV contrast encoding. A horizontal spider web offers a vibration-direction
interaction inspired by research on *Uloborus diversus*. The interface is in
Spanish. Neither representation claims literal animal subjective experience.

The current implementation fills the viewport with the garden and overlays
navigation and representation controls. Scientific lessons open in a modal
drawer. The opening uses human-reference mode. Layered procedural planting,
a tilted flower head, a path, house, and bee character are implemented.

This is an intermediate visual iteration. The latest screenshot still shows
foreground leaves obscuring the flower, flat/repetitive vegetation, and large
empty background areas. It does not meet the selected concept's artistic bar.
The user requested committing and pushing the current changes to `origin/main`.

## Implemented changes

- `src/patio.ts` owns garden placement, path, house, pots, and planting.
- `src/flower.ts` owns remodeled flower geometry and bounded bee arrival.
- `src/main.ts`, `index.html`, and `src/style.css` integrate responsive camera
  framing, full-viewport controls, and the scientific lesson dialog.
- Browser checks cover the revised layout, dialog, initial human mode, scene
  hits, and existing flower/web behavior. Several screenshot comparisons now
  use a pixel-difference tolerance rather than exact equality; they do not
  establish exact render equality or artistic quality.
- Plans, concept images, the independent art review, and style sheet are saved.

## Validation

On 2026-11-17, typecheck, production build, and `npm run check:browser` passed
on Linux, Node v22.23.1, Chromium with SwiftShader. Build retains the Three.js
chunk-size advisory. Chromium required existing libraries through
`LD_LIBRARY_PATH=/tmp/umwelt-browser-libs/extracted/usr/lib/x86_64-linux-gnu`.
Browser checks covered desktop/mobile layout, lesson dialog, flower/web actions,
reduced motion, context loss, fallback, and emulated touch. Evidence is saved in
`test-results/patio/`. `git diff --cached --check` passed before commit.
No physical-phone, hardware-performance, or deployment validation is claimed.

## Current visual target and next actions

The implemented garden remains visually below the selected concept. The user
requested an ambitious new plan. `docs/plans/20261117-garden-art-quality.md`
supersedes the prior renewal plan for future work. It requires full-viewport
composition, enclosing vegetation, production-quality hero assets, and filtered
light before additional animation. Functional completion is not visual acceptance.

Next actions:

1. Establish a shared style sheet and compare two compositions with clear hierarchy.
2. Prove a flower-and-leaf study and material ensemble before expanding assets.
3. Review three connected views independently against the concept and refine gaps.

Ambient motion remains off in the current application. The new plan proposes a
measured breeze with pause, reduced-motion, and hidden-page suspension; that
policy and its tests have not been implemented. Asset authoring tools and target
hardware remain unverified. No deployment or physical-device validation occurred.

The visual review compared saved captures with the selected reference.
See the validation section for current push checks.


## Independent artistic review

At the user's request, an independent agent reviewed the plan and both images.
Seven accepted findings strengthen visual hierarchy, style coherence, detail
rhythm, connected views, independent critique, asset capability, and interface
states. Recorded in `docs/art-direction/art-quality-plan-review.md` and integrated
into the plan. No application code or runtime validation changed in this turn.
