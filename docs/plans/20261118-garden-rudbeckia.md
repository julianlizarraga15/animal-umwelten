# Bring the accepted Rudbeckia and broad leaf into the garden

## Question

Does the accepted specimen from `/experiments/botanical-specimen/` hold up in
the afternoon garden as the hero flower and as foreground leaves, while the
bee UV lesson stays on the upper petal surfaces?

## Smallest experiment

- Export head and leaf builders from `src/rudbeckia-specimen.ts`. The isolated
  page keeps calling `createRudbeckiaSpecimen()` with the same random sequence.
- The head can carry a second vertex-color set for the UV view. Only upper
  petal faces change: violet basal guide, yellow distal region. Backs keep the
  human colors (Schlangen et al., 2009; Horth et al., 2014).
- `src/flower.ts` scales the modeled head onto a new stem in the pot, with the
  specimen's basal leaf. The bee and its path stay.
- `src/patio.ts` replaces the flat foreground frame leaves with modeled broad
  leaves, framed like `docs/art-direction/jardin-de-la-tarde.png`.
- `src/main.ts` lighting and the spider modules stay untouched.

## Acceptance

- Typecheck, build, and the browser suite pass, including the reverse-pose
  check (no violet on petal backs) and the UV toggle check.
- Garden capture placed beside the reference.
- Hair cost measured; hair count reduced in the garden if it costs much and
  adds little at garden distance.

## Validation

`npm run typecheck`, `npm run build`, `npm run check:browser`, and a
side-by-side capture script for the garden overview.

## Unresolved

The accepted human palette has an orange ray base, which is stronger than the
"both look yellow" description in Horth et al. Kept as an art choice for now.
