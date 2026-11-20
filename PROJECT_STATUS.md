# Project status

Handoff updated: 2026-11-20 (one leaf, quieter patio)

## Current application

Umwelt Explorer offers an afternoon garden with bounded bee UV contrast and
spider vibration-direction lessons. The interface is Spanish. Renderings do
not claim literal animal subjective experience.

The garden flower is the accepted Rudbeckia. The bee UV guide stays on the
upper ray faces only. `src/main.ts` lighting and the spider modules are
unchanged. The isolated specimen page is unchanged.

On 2026-11-20 the flat patio leaves were removed. Canopy, wall vines, and a
few path plants now use the same broad leaf as the foreground, at 48 by 32
rings and without hairs (`GARDEN_LEAF` in `src/patio.ts`). The middle pot, the
tile sprout, the two plane-petal flowers, and the 42 ground leaves are gone.
Four violet spikes remain behind the pot. The back wall is sparser than
`docs/art-direction/jardin-de-la-tarde.png`, and one upper leaf still enters
from off-frame.

## Validation

On 2026-11-20, `npm run typecheck`, `npm run build`, and `npm run check:browser`
passed. The build keeps the existing chunk-size warning. Hardware WebGL on the
Intel UHD GPU, 1456×819, measured about 8.6 ms for the overview and 7.1 ms at
the flower, with 1.37M triangles in the overview. Captures are in
`test-results/patio/garden-rudbeckia/garden-vs-reference-gpu.png`. No phone,
other-browser, or deployment validation.

The dev server is running again at `http://localhost:5173/`. Restoring
`node_modules` required stopping the previous Vite process, which had a
native file locked.

## Next actions

1. Get the user's verdict on the quieter garden.
2. If the wall feels empty, add more of the same leaf there.
3. Soften the petal-back hairs at the reverse inspection pose.

Plan: `docs/plans/20261120-one-leaf-quieter-garden.md`. Work is uncommitted.
Nothing was pushed or deployed.
