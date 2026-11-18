# Project status

Handoff updated: 2026-11-18 (canopy and ray palette refined)

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
broad leaves in the lower corners. The upper canopy now uses low-resolution
curved leaves with central veins. They do not cast shadows on the flower or
pot. `src/main.ts` (afternoon light) and the spider modules are unchanged.
The human ray base is warmer gold; the UV guide colors stay unchanged.

The isolated page `/experiments/botanical-specimen/` is unchanged. The shared
specimen module still exports `createRudbeckiaHead` and `createBroadLeaf` and
keeps the specimen's random sequence. Its human ray base now uses the warmer
gold palette too.

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
and `hair-density-crop-0-025-1.png`. Canopy and palette recaptures are under
`test-results/patio/garden-rudbeckia/iteration-20261118-canopy/`.

## Validation

On 2026-11-18: typecheck, build, browser suite, and fresh garden capture passed
in a temporary Linux worktree using SwiftShader. The suite includes the UV
toggle and reverse-pose checks (no violet on petal backs). The capture had no
page errors and reported 1,351,496 patio triangles and 406 draw calls, down
2,016 triangles and 28 draw calls from the pushed garden snapshot. The isolated
specimen recapture also had no page errors. SwiftShader timings do not measure
device performance. The build keeps the existing chunk-size warning. No phone,
other-browser, or deployment validation.

## Open questions

- The garden composition has no user visual verdict yet beside the concept.
- At the reverse inspection pose, petal-back hairs read as isolated thorns.

## Next actions

1. Get the user's visual verdict on the new canopy and palette capture.
2. Review the isolated petal-back hairs at the reverse pose.
3. Continue the art-quality plan by filling the open back wall.

Plans: `docs/plans/20261118-garden-rudbeckia.md` and
`docs/plans/20261118-canopy-and-ray-palette.md`. Current changes are being
committed on `main` after pushed commit 8b0d50b. Nothing is deployed.
