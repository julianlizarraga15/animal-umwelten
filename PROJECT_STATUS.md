# Project status

Handoff updated: 2026-11-20 (spider web and silhouette)

## Current application

Umwelt Explorer offers an afternoon garden with bounded bee UV contrast and
spider vibration-direction lessons. The interface is Spanish. Renderings do
not claim literal animal subjective experience.

The garden flower is the accepted Rudbeckia. The bee UV guide stays on the
upper ray faces only. The spider web uses a wider spiral, fewer spokes, and an
eight-legged silhouette with curved, leafy supports. The stray upper-left
canopy leaf is gone; one smaller leaf frames the lower-left edge. The isolated
specimen page is unchanged.

On 2026-11-20 the flat patio leaves were removed. Canopy, wall vines, and a
few path plants now use the same broad leaf as the foreground, at 48 by 32
rings and without hairs (`GARDEN_LEAF` in `src/patio.ts`). The middle pot, the
tile sprout, the two plane-petal flowers, and the 42 ground leaves are gone.
Four violet spikes remain behind the pot. On 2026-11-21 the wall is one mass of that leaf, with the door and window
left open. Tilted leaves sit beside the path. The opening web is dimmer and
still a flat oval. See `docs/plans/20261121-garden-depth.md`.

## Validation

On 2026-11-20, `npm run typecheck`, `npm run build`, and `npm run
check:browser` passed. The suite captured the patio and revised spider scene
and exercised desktop, mobile, touch, and WebGL recovery. The build retains its
chunk-size warning. This environment needed the TypeScript Linux executable
and Chromium libraries extracted locally to run the checks; no project lock
or dependency files changed. Captures are in `test-results/patio/`.

Earlier patio baseline validation on 2026-11-20 passed `npm run typecheck`,
`npm run build`, and `npm run check:browser`. The build keeps the existing
chunk-size warning. Hardware WebGL on the
Intel UHD GPU, 1456×819, measured about 8.6 ms for the overview and 7.1 ms at
the flower, with 1.37M triangles in the overview. Captures are in
`test-results/patio/garden-rudbeckia/garden-vs-reference-gpu.png`. No phone,
other-browser, or deployment validation.

The dev server is running again at `http://localhost:5173/`. Restoring
`node_modules` required stopping the previous Vite process, which had a
native file locked.

## Next actions

1. Make the opening web read as silk in a garden, not a flat oval.
2. Vary the wall leaves so the mass is less repetitive.
3. Check the reverse petal hairs after the shorter length.

Plans: `docs/plans/20261121-garden-depth.md`,
`docs/plans/20261120-one-leaf-quieter-garden.md`, and
`docs/plans/20261120-spider-scene.md`. The opening view is on `main`.
Nothing is deployed. Look at http://localhost:5173/.
