# Test a volumetric flower and broad-leaf model

## Question

Can an existing CC0 model supply a flower and broad leaves that hold up close
and from an oblique view, closer to `docs/art-direction/jardin-de-la-tarde.png`
than the rejected Gazania scan?

## Smallest experiment

Keep the garden untouched. Add an isolated specimen page that loads local
models, frames each bounding box, and offers orbit, a close view, an oblique
view, neutral inspection light, and the garden's afternoon light.

Candidates after catalog review:

- Poly Haven `potted_plant_02` (CC0): broad veined leaves, worn terracotta, real
  material maps. Leaves are alpha-masked shells, and the plant has no flower.
  This is the strongest untested material candidate.
- Grab3D Sunflower from the Cozy Nature Kit (publisher states CC0): solid petals
  with a visible back, a dark disk, and broad leaves. The catalog render is a
  low-poly illustration, so it may fail the reference's surface quality.

Reject integration unless a browser close-up shows petal or leaf thickness,
readable backs, and material detail at once. A catalog thumbnail is not that test.

## Acceptance

- The page loads both models without console errors and frames them without
  clipping through the subject.
- Desktop and a closer oblique view are captured under afternoon light.
- The visual note states pass, partial, or fail for flower volume, leaf volume,
  and material detail against the afternoon concept.
- The garden modules stay unchanged.

## Validation

Run the specimen in the browser. Run `npm run typecheck`. The garden browser
suite is unchanged and is not a visual verdict for this page.

## Unresolved

Whether any free model reaches the concept remains open until the browser
captures. Whole-garden integration stays blocked on that result.
