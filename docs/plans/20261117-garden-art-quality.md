# Reach the afternoon garden's visual quality

## Goal and question

Create a qualitative visual leap toward the user's selected
[Garden of the Afternoon](../art-direction/jardin-de-la-tarde.png).
Can we deliver its enclosing vegetation, sculpted organic forms, filtered light,
and immersive framing in a real, navigable browser scene?

This plan supersedes `20261117-garden-renewal.md` for future visual work.
The previous implementation added the scene's objects but did not achieve its
composition or asset quality. The user requested planning; no work below is
claimed complete. Retain Three.js and the two educational interactions.

## Art direction contract

Build a sheltered garden seen between plants, with a warm path leading inward.
The flower occupies the left middle distance; the horizontal web has a legible
space at right. Foreground leaves overlap the edges and roof the scene. Midground
plant groups break up pots and stems. Climbers partly conceal the peach house.
Warm illuminated petals contrast with cooler foliage shadows. Keep intentional
openings around the flower, web, and path; dense planting must not become clutter.

The opening garden fills the viewport. Remove the persistent desktop lesson
sidebar and oversized opening heading. Use a small title, accessible destination
controls, and a contextual lesson drawer. On mobile, compose the scene separately
and keep both destinations reachable. Full-viewport rendering is not a request
for browser fullscreen permission.

The image's delicate textures support its silhouettes and lighting. A flat flower,
polygonal filler shrubs, or empty wall cannot pass because their colors match.
The concept's web orientation and incidental plant details are not scientific
references. Preserve the documented horizontal web and upper-petal signal.

## Visual language and hierarchy

Produce a one-page style sheet from crops of the selected concept before expanding
the asset kit. Define curved shape language, edge softness, warm/cool color
relationships, material roughness, texture scale, and permitted detail density.
Include typography, spacing, translucent interface surfaces, focus appearance,
and transition character. These choices must form one coherent style.

Establish the first read: the lit flower and bee, then the inviting path, then
the web. Keep the house subordinate and foreground leaves quieter than the
subjects. Judge small thumbnails and grayscale captures before surface detail.
Reject a frame dominated by the wall, pot rim, interface, or a bright background
opening. This hierarchy applies to the overview; each inspection view has its
own focal subject.

Compose large quiet foliage masses, medium plant groups, and sparse fine accents.
Reserve negative space around the flower silhouette and web. Use repetition with
controlled variation for rhythm. Inspect silhouette-only and reduced-size color
captures. If every area has equal contrast or detail, simplify before adding.

## Smallest experiment that can settle feasibility

Produce one art-complete browser frame, plus a short camera move that reveals
real depth. Include one finished flower, one finished foreground leaf family,
three depth layers of planting, the path, and filtered afternoon light. Capture
it beside the concept at the same landscape aspect ratio and in portrait.

This is a substantial vertical slice. Do not distribute placeholder-quality
assets through the whole garden or polish more animation before this slice works.
A generated background image cannot substitute for navigable foreground geometry.

Validate three connected views before declaring this slice visually complete:
the opening, flower inspection, and web inspection. Save a continuous camera
recording between them. Build those routes early enough to detect bare transitions,
exposed backs, repeated filler plants, and clipping. The opening remains the
primary art target; every destination needs a composed background.

## Work packages and evidence

### A. Recompose the experience

- Save the current desktop/mobile overview and interaction captures as baseline.
- Build the full-viewport layout and a temporary composition using simple meshes.
- Arrange foreground canopy, hero subjects, path, midground planting, and house.
  Reframe the camera to reveal the flower's upper face and layered petals.
- Make two actual browser compositions with the same subjects; compare their
  shelter, depth, and target clarity, then retain the stronger one.
- Add the lesson drawer with keyboard focus, dismissal, and persistent access
  to scientific explanation. Keep controls clear of flower and web hit areas.

Evidence: landscape and portrait blockouts, with annotated depth layers and
interaction targets. Pass when foliage encloses the view above and at its sides,
the path leads into depth, and exposed architecture is secondary. A room-like
corner with a central pot fails this stage even if navigation works.

### B. Establish a production-quality asset pipeline

Inventory Blender or other available authoring tools before building assets.
Choose authored GLB hero models by default. Procedural generation remains useful
for controlled variation and placement, but must meet the same visual standard.
If authoring tools are unavailable, record the specific gap and prepare an asset
brief; continue composition and interface work without claiming asset completion.

First finish a single flower-and-leaf study under the target browser lighting.
Capture a close crop and a scene-scale view. Judge curvature, material response,
and softness against the reference. Render terracotta and paving beside them to
check that the materials belong together. GLB export or high polygon counts do
not establish artistic quality. If the study fails, change the asset-production
method before expanding the kit; report any unresolved capability gap.

Produce a compact reusable kit only after that study passes:

| Asset | Required visible quality |
| --- | --- |
| Hero flower | Cupped and twisting petals, varied droop and overlap, raised dark disk, curved stem, distinct petal faces |
| Foreground leaves | Sculpted central fold, rolled edges, readable veins, believable underside, several distinct silhouettes |
| Supporting plants | Tall flower spikes, broad-leaf clusters, and a climbing plant with varied growth directions |
| Terracotta | Uneven rim, shaped thickness, restrained chips and worn surface color |
| Path | Uneven stone edges and height, small joints and selective growth, clear route through planting |
| Bee and spider | Readable anatomy and silhouettes at their actual display sizes |

Keep editable source assets, exported runtime files, and reproducible export
instructions. Record origin and license in an asset manifest. Generated texture
candidates need seam, scale, and baked-light checks. Purchased assets are a
separate purchase choice. Shared atlases and instancing can support repetition;
avoid identical leaves arranged in obviously repeated radial clusters.

Evidence: hero flower and leaf turntables rendered in the application, not only
in the authoring tool. Inspect both sides, close views, and flower mode switching.
Pass when the silhouettes and surface response hold up under the actual camera
and light. Fix the asset before propagating it across the garden.

### C. Build the reference frame and light it

Dress the composition with the approved kit. Place large enclosing shapes first,
then small plants and wear. Use asymmetry and grouped growth. Keep small detail
away from the subjects when it competes with the lesson.

Use foliage to cast broken shadows across the path and house. Replace the broad
hard triangular wall shadow as the main lighting feature. Tune warm directional
light, softer fill, contact shading, and restrained backlit leaf response.
Separate roughness, normal detail, and color variation. Preserve flower signal
legibility under the final light.

Evaluate baked indirect/contact shading on static surroundings and selective
live shadows for moving subjects. Add restrained atmosphere or color grading
only after the base scene works. Depth of field is optional and must not obscure
a target or conceal poor assets. Keep highlights detailed rather than blown out.

Evidence: reference/current/candidate contact sheet, a short parallax recording,
and a notes file listing remaining visible mismatches. The real browser frame
must pass every visual acceptance item below before expanding animation.

### D. Integrate a living garden

Design opening controls, flower lesson, and web lesson as three complete visual
states. Apply the style sheet to the expanded drawer as well as collapsed controls.
Review desktop and portrait screenshots with text visible; keep type and surfaces
away from focal silhouettes. An attractive scene with an unfinished overlay does
not pass interface review.

Connect the revised scene to flower and web approaches, cancellation, and return.
Rehearse the whole camera route for leaf clipping and awkward framing. Preserve
orientation between destinations. Refine the bee's deceleration and landing and
the spider's success movement after asset scale and placement settle.

Plan a subtle shared breeze affecting stems and leaves with different delays.
Ambient motion is a deliberate change to the previous no-idle-animation policy.
Implement it only with a pause control, reduced-motion support, suspension while
the page is hidden, and recorded device cost. Keep one animation scheduler.
Pause decorative motion during close signal inspection and web search so it
cannot resemble a directional cue or disclose prey. Update idle-render tests to
assert settling in paused, hidden, and reduced-motion states, rather than removing
their protection. A static lower-quality mode retains the complete interaction.

Evidence: recordings of both complete journeys, pause/resume, reduced motion,
keyboard, touch, and context-loss recovery. Spatial comparison remains stable
when representations switch.

### E. Optimize and package the result

Keep the flower, foreground silhouettes, and composition on all quality settings.
Reduce distant planting detail, shadow cost, texture resolution, and optional
postprocessing first. Record a repeatable asset build and capture procedure.
Document loading/error behavior for new external models and textures.

Use the existing browser verification script as the driver. Extend it only for
new user-visible behavior and add a reproducible capture route for the reference
frame. Run `npm run typecheck`, `npm run build`, and `npm run check:browser`.

## Visual acceptance

Assess these independently of functional test results:

- The full-viewport garden replaces the boxed scene and permanent text sidebar.
- Vegetation frames the top and sides and occupies foreground, middle, and back.
- The flower has curled, overlapping volume rather than a flat radial silhouette.
- The path and overlapping plants establish depth during a real camera move.
- Filtered leaf shadows and warm/cool separation replace uniform orange surfaces.
- Pots and architecture have believable shape and restrained material variation.
- The flower and horizontal web remain readable without removing the canopy.
- Portrait framing preserves atmosphere and usable controls.

Mark each item pass, partial, or fail beside a screenshot and concrete remaining
work. Every item must pass for visual completion; do not average away a failure.
The user evaluates the delivered composition against the selected reference.
Present that comparison proactively. Exact pixel parity is not promised.

At composition, asset-ensemble, and final-scene checkpoints, request an independent
visual critique from an agent or reviewer who did not create that artifact.
Provide the concept and actual browser evidence. The reviewer identifies the
three largest remaining gaps and classifies them as composition, asset, lighting,
or interface issues. Address those gaps and return the same views for review.
Keep observations separate from artistic judgments. Do not invent a numerical
beauty score or treat a checklist as proof of beauty.

Use the critique to resolve routine choices autonomously. Show the user the
resulting comparison; do not make them the sole quality reviewer after a long
implementation. A result that merely looks better than the previous version is
insufficient. The image must hold together as a compelling composition, and the
connected views must sustain that quality.

## Validation and performance

Store evidence under `test-results/patio/art-quality/`, preserving earlier files.
Capture a landscape view matching the reference, 1440x1000 desktop, and 390x844
portrait. Include human-reference and UV views, reverse petals, web search and
success, lesson drawer, loading failure, and reduced motion. Compare art direction
in human-reference mode to avoid conflating UV encoding with material quality.

Measure cold asset transfer, decoded texture cost, draw calls, triangles, and
frame times for identical journeys before and after changes. Record hardware,
browser, viewport, pixel ratio, warm-up, and repeated samples. Provisional targets
are p95 frame times at or below 16.7 ms on the selected desktop and 33.3 ms on the
selected phone. These are goals, not established capability. Select and document
representative devices before claiming performance acceptance. SwiftShader and
emulated touch establish neither hardware performance nor physical usability.

Run the existing behavioral regressions, including hidden prey, mode stability,
reverse-petal equality, fallback, context recovery, and drag rejection. Preserve
the evidence boundaries in [bee vision](../research/bee-vision.md) and
[web vibrations](../research/spider-vibrations.md). Research any new sensory claim
before introducing it; artistic motion and scale remain labeled design choices.

## Sequence, risks, and unresolved choices

A establishes composition and connected camera routes. B proves the hero study
alongside A; C requires both. D adds character animation and ambient life after
visual acceptance of C. E measures cost throughout and closes delivery.
Work on one strong garden before extending its area or adding animals.

Main risks are insufficient asset-authoring quality, foliage overdraw, excessive
shadow cost, and a mobile crop that loses enclosure. Test these in the first
slice. Do not resolve them by reverting to the old empty composition. If a method
fails twice to improve the same visible gap, change the method and document why.

Unresolved facts: available authoring tools, asset production capability, and
representative hardware. Unresolved design details: exact leaf species, final
lesson-drawer layout, and breeze amplitude. Resolve routine artistic choices
through rendered comparisons. Keep external purchases separate from local work.

## Planning validation

Based on the current project status, previous plan, and direct comparison of the
latest saved desktop capture with the selected concept in this conversation.
No new models, runtime tests, or performance measurements were produced. The
plan's deliverables are pending. Documentation links and whitespace are checked.


## Independent plan review

An independent agent inspected both images and this plan on 2026-11-17. The
review found that object-presence criteria could still admit a mediocre result.
This revision adds visual hierarchy, a unified style sheet, mass/detail rhythm,
connected-view acceptance, independent critique, an early asset-capability study,
and complete interface states. These are strengthened production requirements,
not evidence that the future scene already meets them. See the
[review record](../art-direction/art-quality-plan-review.md).
