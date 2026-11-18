# Project status

Handoff updated: 2026-11-18 (Rudbeckia integrated into the garden)

## Current application

Umwelt Explorer offers an afternoon garden with bounded bee UV contrast and
spider vibration-direction lessons. The interface is Spanish. Renderings do
not claim literal animal subjective experience.

The garden flower is now the accepted authored Rudbeckia. `src/flower.ts`
scales the head from `src/rudbeckia-specimen.ts` (×32) onto a new stem, adds
three basal broad leaves in the pot, and keeps the bee. The UV view swaps a
second vertex-color set on the rays. It changes only the upper faces: violet
basal guide, yellow distal region. Petal backs keep human colors.
`src/patio.ts` replaces the flat frame and flower-collar leaves with modeled
broad leaves in the lower corners, following
`docs/art-direction/jardin-de-la-tarde.png`. The upper canopy is still flat
schematic leaves. `src/main.ts` (afternoon light) and the spider modules are
unchanged.

The isolated page `/experiments/botanical-specimen/` is unchanged. Its
recaptures are pixel-identical to the accepted ones. The specimen module now
exports `createRudbeckiaHead` and `createBroadLeaf` without altering the
specimen's random sequence.

## Cost and hairs

Garden leaves keep 25% of the specimen's 7,100 hairs per leaf (`LEAF_HAIR_DENSITY`
in `flower.ts`, `FOREGROUND_HAIR_DENSITY` in `patio.ts`). Hardware WebGL on
an Intel UHD GPU, 1456×819, median of look-around renders:

- Previous commit 60b14d6: overview 6.8–8.3 ms, flower 6.5–7 ms, 162k triangles.
- Now: overview 8.5–11 ms, flower 6–6.9 ms, 1.35M triangles.

Removing hairs entirely did not change frame time beyond noise. Most added
cost is the seven 72k-triangle leaf blades, including their shadow pass. The 25% density keeps
the fuzzy rim that full density gives. Captures and JSON are in
`test-results/patio/garden-rudbeckia/`, including `garden-vs-reference-*.png`
and `hair-density-crop-0-025-1.png`.

## Validation

On 2026-11-18: `npm run typecheck`, `npm run build`, and `npm run check:browser`
passed (SwiftShader), including the UV toggle and reverse-pose checks (no violet
on petal backs). The build keeps the existing chunk-size warning.
`node scripts/capture-garden.mjs [--gpu]` (after a build) captured the garden,
flower views, and timings without page errors. No phone, other-browser, or
deployment validation.

## Open questions

- The garden composition has no visual verdict yet beside the concept.
- The human view shows an orange ray base. The lesson says both regions look
  yellow to humans (Horth et al., 2014).
- At the reverse inspection pose, petal-back hairs read as isolated thorns.

## Next actions

1. Get the user's visual verdict on `garden-vs-reference-gpu.png`.
2. Replace the flat upper canopy leaves with broad leaves, probably with a
   lower-resolution blade to contain triangles.
3. Decide whether to soften the orange ray base in the human view.

Plan: `docs/plans/20261118-garden-rudbeckia.md`. Work is uncommitted on
`main` at 60b14d6. Nothing was pushed or deployed.
