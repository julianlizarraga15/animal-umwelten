# Refine the garden canopy and human ray palette

## Question

Can the upper foliage read as broad leaves without the large flat paddles, while the human flower view keeps both ray regions visually yellow?

## Smallest experiment

- Keep the existing leaf and flower builders unchanged.
- Add a low-resolution curved leaf surface with a thin central vein for upper canopy leaves only.
- Shift the human ray base from burnt orange toward warm yellow. Keep the UV guide colors unchanged.
- Capture the overview and human flower view beside the current accepted screenshots.

## Acceptance

- The canopy has a visible curved blade and midrib without dominating the flower.
- The human view reads as yellow across the ray, while the UV view retains its violet basal guide and yellow distal region.
- Typecheck, build, browser checks, and capture complete without page errors.
- Triangle count does not materially increase.

## Validation

Run `npm run typecheck`, `npm run build`, `npm run check:browser`, and `node scripts/capture-garden.mjs` after the change.

## Unresolved

The garden screenshot has not received a user visual verdict. This pass uses the current reference and the documented human-color description as the working target.
