# A garden you can walk into

## Goal

On the opening view, a new viewer can point to three layers without reading
the interface. Broad leaves in front, the Rudbeckia, and a planted back wall
with pots along the path. The wall is no longer a blank rectangle.

## Failed premise

Two passes assumed that fewer plants would make the patio clearer. The
opening view then read as a flower and a web in an empty box. The concept is
dense. Clarity comes from layers, not from deletion.

## This unit

Stand copies of the existing broad leaf against the wall, droop a row over
the coping, and set two smaller pots beside the path. Keep the afternoon
light, the UV guide, and the spider lesson.

## Check

A capture of the opening view, then typecheck, build, and the browser suite.
The capture fails if the wall is still a blank rectangle or the flower is hidden.

## Result on 2026-11-21

A later capture fills the wall as one mass, keeps the door, the window, and
the flower readable, and puts tilted leaves beside the path. The web is dimmer
and still reads as a flat oval from the opening view. Petal-back hairs are
shorter. The random stream is unchanged because the hair count stayed at 40.

`npm run typecheck`, `npm run build`, and `npm run check:browser` passed.
The overview is about 1.53M triangles. Capture:
`test-results/patio/garden-rudbeckia/garden-gpu.png`.
