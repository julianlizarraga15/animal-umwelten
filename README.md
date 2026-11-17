# Umwelt Explorer

Explore a small patio corner from a first-person viewpoint, approach one
schematic flower or horizontal spider web, and compare bee-relevant UV contrast
and a vibration-direction encoding with human references. Inspired by Ed Yong's *An Immense World*. The interface is in Spanish.
False colors explain a documented signal and do not reproduce an animal's
subjective experience.

## Run locally

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173. File polling is
enabled for this Windows-mounted WSL checkout. Drag on the canvas or use the
directional buttons (or arrow keys when the canvas is focused) to look around
from your current position. Click or tap the flower—or press "Acercarse a la
flor"—to approach the upper petals, and "Volver al patio" to cancel travel or
return. Switch between "Contraste UV" (initial mode) and "Referencia humana"
with the radio controls; arrow keys change a focused radio selection.

Choose "Acercarse a la red" or tap the web to explore the second signal. At the
web, tap a location or use the four numbered sector buttons. "Buscar una mosca"
starts a challenge with the insect hidden in both modes. Follow the strongest
highlighted radius, choose its numbered sector, and retry or repeat the signal
as needed. The insect appears after a correct answer. Switching representations
preserves the round. Leaving the web cancels it. The fixed web camera keeps the
numbered controls aligned with the scene. Reduced motion uses a static cue.

## Check the application

```sh
npm run typecheck
npm run build
npm run preview
```

The production build is in `dist/`. Preview serves it locally and is not a
production hosting service.

For the automated browser check, install Chromium once, then run the check.

```sh
npx playwright install chromium
npm run check:browser
```

The check uses the production build, launches a temporary preview server on port
4174, and writes screenshots, a recording, and metadata to `test-results/patio/`
(preserving `test-results/flower/` as historical baseline evidence).
On Linux, Playwright may also need system libraries installed with
`npx playwright install-deps chromium`. Browser rendering in automated checks uses
software WebGL. This does not establish hardware performance or educational value.

## Science and limits

The [research brief](docs/research/bee-vision.md) records primary sources and their
limits. *Apis mellifera* is the sensory reference. The schematic floral pattern is
based on *Rudbeckia hirta*. Pattern extent and colors are not measured reflectance.
The two sources of evidence do not constitute a behavioral test of this exact
bee and flower pairing.

The [spider research brief](docs/research/spider-vibrations.md) separates observed
vibration-guided orientation in *Uloborus diversus* from the schematic web,
numbered sectors, and turquoise pulse graphics used here. The hidden insect is
a teaching choice and does not imply spider blindness.

## Working on the project

Start with [PROJECT_STATUS.md](PROJECT_STATUS.md) and [AGENTS.md](AGENTS.md).
Plans live in [docs/plans](docs/plans). Settled choices go in
[DECISIONS.md](DECISIONS.md). Ideas go in [BACKLOG.md](BACKLOG.md).
Use `$handoff` to refresh the status before ending a session.
