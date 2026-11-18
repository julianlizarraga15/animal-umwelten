# Author a Rudbeckia specimen and a broad leaf

## Question

Can a procedurally authored Rudbeckia head and one broad foreground leaf hold
up in overview, close, and oblique views under the afternoon light, next to
`docs/art-direction/jardin-de-la-tarde.png`, where the CC0 catalog models failed?

## Smallest experiment

Add a third specimen to `/experiments/botanical-specimen/`, built in code:

- Ray petals as closed slabs with rounded rims, cupping, lengthwise grooves,
  a notched tip, and two overlapping whorls.
- A dark domed disk with phyllotactic florets and pollen on the outer ring.
- Green phyllaries under the head, so the back of the flower reads.
- One broad leaf with a V-fold at the midrib, sunken veins on top, raised
  ribs and a midrib keel underneath, and a visible rounded edge.
- Matte, velvety materials through sheen, not gloss.

The garden modules stay untouched.

## Acceptance

- The page builds the specimen without console errors.
- Overview, close, and oblique captures under afternoon light show petal
  thickness, a readable flower back, the leaf fold, veins, and leaf edge.
- Each capture is placed side by side with the reference and judged
  pass, partial, or fail in `docs/art-direction/botanical-model-review.md`.

## Validation

`npm run typecheck`, then `scripts/capture-botanical-specimen.mjs` against
the local Vite server.

## Unresolved

Thickness is exaggerated relative to real petals and leaves, as an art
choice. Whether the result is good enough for the garden is a visual verdict,
not settled by this plan.
