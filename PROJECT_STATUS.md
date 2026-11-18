# Project status

Handoff updated: 2026-11-18 (authored Rudbeckia specimen)

## Current application

Umwelt Explorer offers an afternoon garden with bounded bee UV contrast and
spider vibration-direction lessons. The interface is Spanish. The schematic
Rudbeckia and horizontal web do not claim literal animal subjective experience.
The main application remains below the selected garden concept's graphical bar.

The existing Three.js application fills the viewport and uses a scientific lesson
dialog. `src/patio.ts` owns surroundings, `src/flower.ts` owns flower geometry,
and `src/main.ts` connects navigation. Ambient motion remains off. Those garden
modules were not changed in the latest model test.

## Graphical quality experiments

The procedural flower study and the Poly Haven Gazania import both failed the
reference. Gazania improved leaf contours and surface detail, then an independent
review rejected thin surfaces, dark backs, hard shadows, and framing. Evidence
remains in `test-results/patio/graphics-study-authored/`. Its implementation
worktree is no longer available on this machine.

The isolated page `/experiments/botanical-specimen/` now opens on a
Rudbeckia and broad leaf modeled in `src/rudbeckia-specimen.ts`. Rays, phyllaries,
and the leaf are closed surfaces with real thickness. The leaf has a midrib
fold, sunken veins on top, raised ribs below, and a pale margin. The disk is
a dome of 300 florets. The page keeps the garden's afternoon rig unchanged.
The CC0 syngonium and sunflower stay selectable for comparison and remain
rejected. Catalog search is closed.

A material pass added bump-mapped ray striations, a tinted transmitted-light
term, about 8,000 instanced hairs, and a reticulate leaf texture. Captures
beside `docs/art-direction/jardin-de-la-tarde.png` now pass on form and
material in close and oblique views. In overview, the leaf seen from above
still reads as a sheet, and the petiole joint is awkward. On 2026-11-18 the
user checked the page and accepted the specimen as good enough for now. The verdict and botanical basis are in
`docs/art-direction/botanical-model-review.md`. Ray and leaf widths are wider
than documented for *R. hirta*, following the concept. Nothing entered the
garden.

The page runs on the local Vite server at
`http://localhost:5173/experiments/botanical-specimen/`. This is a development
server, not a deployment.

## Validation

On 2026-11-18, `npm run typecheck` and `npm run build` passed. The build still
shows the existing chunk-size warning.
`node scripts/capture-botanical-specimen.mjs` reported no page errors and saved
overview, close, and oblique views, plus side-by-side frames with the concept
(`rudbeckia-vs-reference-*.png`). Pass `--catalog` to recapture the two CC0
models. The captures used SwiftShader software rendering. The garden browser
suite was not rerun because no garden module changed. No physical-device
performance or deployment validation is claimed.

## Next actions

1. Integrate the accepted specimen into the garden. Keep the bee UV lesson
   on the upper petal surfaces.
2. Measure the frame cost of the hairs with hardware WebGL, and reduce the
   hair count if needed.
3. Optional polish: the leaf's overview read and the petiole joint.

Plans are `docs/plans/20261118-authored-rudbeckia.md`,
`docs/plans/20261118-hero-botanical-model.md`, and the earlier
graphics studies. The broader garden plan remains
`docs/plans/20261117-garden-art-quality.md`. The specimen work is committed
locally. Nothing was pushed or deployed.
