# Give the patio a warm, distinctive atmosphere

## Question and scope

Can one carefully composed garden corner feel inviting and worth exploring while
keeping the flower contrast and web-direction lessons clear?

The user requested this plan. Implementation has not started. Journey is a mood
reference supplied by the user: atmosphere, scale, and quiet discovery. Develop
an original garden with its own palette and objects.

## Smallest experiment

Create one static patio composition using the existing flower and web. Compare
it with the current scene at identical desktop and mobile viewport sizes before
adding animation. Use a low viewpoint, a curved foreground leaf, and an open
route toward both interaction targets. Preserve usable camera destinations.

Try two lighting treatments on the same composition: warm late-afternoon sun
with peach walls, and softer light with cooler shaded walls. Keep flower signal
colors unchanged. Recommend the treatment that gives the garden depth while
keeping both targets and their signals readable. Save comparison captures.

## Visual direction

- Use peach plaster, worn terracotta, sage foliage, and restrained violet shadows.
  Reserve strong yellow for the flower. Exact colors remain tentative.
- Use broad, curved silhouettes and subtle surface variation. Avoid photographic
  texture noise and uniform geometric repetition.
- Add three related details: a repaired pot, a water stain, and a plant between
  tiles. Place them around the focal subjects without hiding the web.
- Shape the scene with a sunlit patch, softer contact shadows, and a shaded refuge.
  Test petal translucency only if the upper UV pattern and plain backs stay clear.
- Keep the editorial typography. Give the scene more room and show short prompts
  near relevant actions. Keep explanations and scientific limits accessible.

## Sequence

1. Capture the current patio, flower, and web on desktop and mobile. Record the
   camera poses and baseline rendering behavior so comparisons remain useful.
2. Build and compare the two static treatments. Work mainly in `src/patio.ts`
   and the existing lighting setup. Refine flower shape and materials only where
   the close view needs it. Select a treatment from actual captures.
3. Add bounded animation to the chosen scene. Start with a brief plant sway on
   arrival and smoother camera acceleration and settling. Keep framing fixed
   when switching representations. Use the existing scheduler in `src/main.ts`.
4. Give the web success a restrained response, such as a short spider approach.
   Preserve the hidden-prey search and distinct directional cue. Decorative
   motion must not disclose the answer or resemble a vibration instruction.
5. Adjust scene space and contextual copy in the existing interface, then verify
   the complete flower and web journeys. Save screenshots and a short recording.

A bee arrival and landing is a later candidate. It adds a character asset and
animation work, so it is not required to prove the first visual improvement.
Do not add new species, free flight, audio, or a new rendering framework here.

## Acceptance criteria

- Desktop and mobile captures show deliberate foreground, focal subjects, and
  background separation. Both destinations remain recognizable and selectable.
- The patio has a coherent palette and recognizable handmade details. Compare
  captures directly; aesthetic success is a visual judgment, not a pixel score.
- Flower contrast remains legible, confined to upper petal surfaces, and stable
  under representation switching. Light and camera do not change with the mode.
- Web cues remain distinct from decoration. Hidden prey stays hidden until found.
- Motion starts and ends smoothly, respects cancellation, and settles completely.
  Reduced motion presents an equally usable static scene.
- Retain demand-driven rendering after bounded motion. Continuous breeze or dust
  requires a separate decision and measured cost; it is not part of this pass.
- Controls remain accessible by keyboard and touch without text overlap or new
  obstructions. Context loss and recovery retain the existing reset behavior.

## Validation

For implementation, run `npm run typecheck`, `npm run build`, and
`npm run check:browser`. Extend behavior checks only for changed interactions.
Inspect desktop 1440x1000 and mobile 390x844 captures of the patio, both flower
representations, and web search and success. Also inspect reduced motion.
Store new evidence under `test-results/patio/` without replacing historical
flower evidence. Verify settled RAF and draw counters after new animations.

Compare frame timing on the same hardware and viewport before and after the
change. A physical-phone check remains necessary for device performance and
touch usability; SwiftShader results establish neither. If shadows or materials
cost too much, simplify those effects before reducing signal legibility.

This plan introduces no new sensory claims. Preserve the boundaries and sources
in [bee vision](../research/bee-vision.md) and
[spider vibrations](../research/spider-vibrations.md). Scale, lighting, camera,
and decorative movement are artistic choices, not literal animal experience.

## Unresolved choices

- Select the lighting treatment after comparing rendered captures.
- Decide how much explanatory text can move behind contextual disclosure without
  hiding the distinction between sensory evidence and visual encoding.
- Determine whether existing procedural geometry can achieve the desired petal
  and leaf silhouettes before adding authored assets or dependencies.

## Planning validation

Reviewed project status, decisions, backlog, and saved patio evidence during the
conversation. This is a documentation-only plan. Application checks are deferred
until implementation; no new runtime or performance results are claimed.
