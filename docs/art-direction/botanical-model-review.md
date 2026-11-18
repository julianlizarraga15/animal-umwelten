# Botanical model check

Reviewed on 2026-11-18 in the isolated page
`/experiments/botanical-specimen/`, under the garden's afternoon light.
The garden modules were not changed. Captures are in
`test-results/patio/botanical-specimen/`. Chromium reported no page errors.

## Authored Rudbeckia and broad leaf

Built in `src/rudbeckia-specimen.ts`. Side-by-side frames with the concept
are `rudbeckia-vs-reference-{overview,close,oblique}.png`.

- Flower volume: pass. Fourteen rays in two overlapping whorls have rounded
  rims, cupping, grooves, and drooping tips. From the side the rays show
  thickness, and green phyllaries give the head a readable back.
- Disk: pass. A dark dome carries 300 phyllotactic florets with pollen on
  the outer ring.
- Leaf volume: pass in close and oblique views. The midrib fold, sunken veins
  on top, raised ribs below, and the rounded edge all read. Partial in
  overview: from above, the blade still looks like a sheet, and the petiole
  joint is awkward.
- Material, first pass: partial. Petals looked like smooth clay, and the
  shaded half of the folded leaf went nearly black.
- Material, second pass: pass in close and oblique views. Fine lengthwise
  striations on the rays come from a bump map. Sunlight passing through
  petals, phyllaries, and the leaf adds an orange or green glow, and the
  shaded leaf half now reads green with its veins. About 8,000 instanced hairs
  give the leaf a velvety margin and cover the phyllaries, stem, and ray backs.
  The leaf surface carries a soft reticulate texture. At the concept's scale,
  the leaf matches its foreground sage leaves and the head matches its
  Rudbeckia.
- Remaining: partial. From above in overview the leaf still reads as a
  sheet, and the petiole joint is awkward. The bare orange stage of the
  specimen page is not part of the model.

The specimen now holds beside the concept in close and oblique views. The
user checked it in the page and accepted it for now. It has not been
integrated into the garden yet.

Botanical basis: *Rudbeckia hirta* has 8–16 rays, discs 12–22 × 10–20 mm with
250–500+ florets, and hispid to hirsute stems, phyllaries, and leaves
([Flora of North America, vol. 21](https://floranorthamerica.org/Rudbeckia_hirta)).
The ray count, disk, floret count, and stem hairs follow that source.
Rays 17–19 mm wide (documented 5–10 mm) and a 9.8 cm leaf (basal blades to
7 cm) follow the concept, not the species. Petal and leaf thickness is also
exaggerated. The model is a visual specimen, not a measurement, and not
how a bee perceives the flower.

## Syngonium, Poly Haven `potted_plant_02`, CC0

- Flower: fail. The model has no flower.
- Leaf volume: fail. Broad leaves show veins, but close and oblique views
  reveal thin alpha shells, glossy faces, and dark backs.
- Material: partial for the weathered terracotta pot. The foliage stays a
  tropical houseplant, unlike the concept's matte sage leaves.

## Sunflower, Grab3D Cozy Nature Kit, CC0

- Flower volume: partial. Petals and the disk have solid backs, and the head
  reads from the side. The surfaces stay smooth and low-detail.
- Leaf volume: fail. The leaves are plain bent shapes without a fold, veins,
  or a distinct underside.
- Material: fail. Flat color does not approach the concept's modeled petals
  or velvety foliage.

Neither catalog specimen is a hero Rudbeckia or a foreground leaf. Keep both
out of the garden. Poly Haven plants inspected for this pass use alpha-masked
shells. The solid CC0 kits found in the same search stay at simple game
resolution. A paid botanical library was not purchased.
