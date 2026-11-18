# Prove the garden's graphical quality

## Question

Can a flower, several leaves, and a terracotta pot approach the selected concept's
modeling, material, and lighting quality in an interactive browser render?
The user wants a graphical quality leap. Additional scene objects do not answer
this question. This study implements the asset experiment from the broader
[garden plan](20261117-garden-art-quality.md).

## Smallest experiment

Create an isolated Three.js study under `experiments/graphics-study/` with its own
documented launch command. Reuse the installed dependency. Keep the garden's
default entry and scientific interactions intact. Treat this as an experiment
until its rendered evidence passes review.

Show one flower with curved petals and a raised disk, a small set of distinct
leaves, and one pot on a simple ground plane. Provide pointer orbit, reset, and
two labeled treatments with the same geometry and camera. Compare a neutral
material inspection light with the intended warm afternoon treatment. Keep the
interface in Spanish. Do not add a house, supporting plants, or ambient motion.

## Implementation sequence

1. Inspect `src/flower.ts`, `src/patio.ts`, `src/procedural.ts`, and the existing
   browser capture helpers. Read the TypeScript skill before TypeScript files.
   Save a fresh garden capture without overwriting historical evidence.
2. Check Blender availability beyond `PATH`, available asset tools, and existing
   local assets. Prefer authored geometry and material maps. Blender is currently
   absent from `PATH`; no other installation has been verified. Record the chosen
   method and any limitation before implementing it. A new export format alone
   does not improve a model.
3. Define a small study configuration with a selected light treatment and reset
   camera pose. Keep meshes, materials, and resource disposal owned by the study.
   Avoid changes to the main application's state or rendering architecture.
4. Produce curved, overlapping petals with varied droop, folded leaves with
   readable upper and lower faces, and a pot with a shaped rim. Add restrained
   surface variation at a scale visible in the actual camera. Record source,
   license, and modifications for external assets. Preserve editable sources and
   reproducible generation or export instructions.
5. Tune warm directional light, soft fill, contact shadows, roughness, and
   restrained backlighting together. Compare against the neutral treatment.
   Do not conceal poor geometry with blur, bloom, deep black shadows, or a
   generated image background. A procedural method must meet the same visual bar.
6. Capture both treatments, an oblique view, leaf undersides, and portrait framing.
   Ask an independent reviewer to inspect actual captures alongside the concept.
   Address the largest visible gaps before returning the study.

The throughput checkpoint is the first rendered flower-and-leaf crop. Inspect it
before detailing the pot or building more assets. If repeated adjustments retain
the same flat or plastic appearance, change the asset or shading method and
record why. Do not expand the garden to compensate.

## Acceptance criteria

- Petal curvature and overlap remain visible when the camera rotates.
- Leaves have distinct silhouettes, a central fold, restrained veins, and a
  readable underside. They do not resemble repeated flat paddles.
- Clay looks rough and irregular without noisy textures or exaggerated damage.
- Afternoon light produces depth and readable shadow detail without washed-out
  petals or black undersides.
- The result holds up at scene scale and in a close crop at desktop and portrait
  sizes. Camera controls work without clipping through the subject.
- An independent visual report marks each criterion pass, partial, or fail and
  names the remaining differences from `docs/art-direction/jardin-de-la-tarde.png`.
  Functional checks alone cannot establish visual acceptance.

## Validation and delivery

Save fresh evidence under `test-results/patio/graphics-study/`. Include 1672x941
captures matching the concept, 390x844 portrait captures, and a short orbit video.
Document the launch URL and capture command. Inspect browser errors and exercise
orbit, reset, resize, and both treatments. Ensure an idle study stops rendering
when no interaction requires a frame.

Run `npm run typecheck`, `npm run build`, and `npm run check:browser` for application
changes. Check the experiment separately because existing tests do not cover it.
Do not weaken existing assertions. Report unavailable checks and software rendering
honestly. No hardware performance or visual parity claim follows from these tests.

Deliver the experiment, asset provenance, captures, visual verdict, and remaining
gaps. Update `PROJECT_STATUS.md` using the local handoff skill. Record only settled
decisions and meaningful completed milestones. Do not commit, push, deploy, or
purchase assets as part of this task.

## Unresolved choices

The implementer must verify asset-authoring capability and choose authored or
procedural production from rendered evidence. Runtime cost on physical devices
remains unknown. Whole-garden integration follows only after the study demonstrates
the required quality. The requested implementer is Luna; model availability must
be confirmed by dispatch rather than assumed from configuration text.
