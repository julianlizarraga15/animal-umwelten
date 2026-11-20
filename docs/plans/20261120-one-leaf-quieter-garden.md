# One leaf, and a quieter garden

## Question

Can the patio stop mixing the modeled broad leaf with the old flat leaves, and
read as one garden instead of a pile of props?

## Smallest experiment

- Build background copies of the same broad leaf at 48 by 32 rings, with no
  hairs. The hero leaves and the specimen page stay at full detail.
- Use those copies for the canopy, the wall vines, and a few plants along the
  path.
- Remove the flat leaf geometry, the tile sprout, the middle pot, the two
  plane-petal flowers, and the carpet of 42 ground leaves. Keep four violet
  spikes, farther from the pot.

## Acceptance

- No flat single-sided leaf remains in the patio overview.
- The Rudbeckia still reads first. The web and its pot stay.
- Typecheck, build, and the browser suite pass.

## Validation

`npm run typecheck`, `npm run build`, `npm run check:browser`, and a garden
capture beside the concept.

## Unresolved

Whether the low-detail leaf still reads as the same leaf at canopy scale is a
visual check, not settled here.
