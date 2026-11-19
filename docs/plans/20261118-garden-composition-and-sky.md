# Garden composition and afternoon sky

## Question

How can the patio scene give the Rudbeckia clearer visual priority and replace
the empty upper wall with an afternoon sky that fits the approved concept?

## Evidence

- `../art-direction/garden-composition-prototypes/current-vs-reference.png`
  compares the current garden capture with `jardin-de-la-tarde.png`.
- `../art-direction/garden-composition-prototypes/flower-uv-context.png`
  records the separate close-up UV lesson.

The comparison shows several planters, sprouts, and leaf silhouettes behind and
below the flower. The concept leaves more open space around its main flower and
uses layered garden depth. The current upper background is a continuous blank
wall. These are visual observations, not claims about animal perception.

## Proposed small changes

1. Reduce the number and contrast of secondary pots and small sprouts behind
   the Rudbeckia. Preserve the broad edge leaves that frame the scene.
2. Replace the blank upper wall with a restrained late-afternoon sky gradient
   in the concept's peach and muted gold range. Keep the existing wall below it
   so the patio still reads as an enclosed garden.

Keep the current camera and flower scale for the first pass. This isolates
hierarchy and sky changes before considering a new composition.

## Smallest experiment

The two treatments were captured at the same camera, 1456x819 resolution, and
human reference mode. The first removes the two secondary pots and tile sprout.
The second adds a softer peach sky glow behind the existing wall. Both are
throwaway changes in `/tmp/animal-umwelten-composition-prototype`.

- [Simplified background beside concept](../art-direction/garden-composition-prototypes/background-simplified-vs-reference.png)
- [Afternoon sky beside concept](../art-direction/garden-composition-prototypes/sky-afternoon-vs-reference.png)
- [Current garden beside concept](../art-direction/garden-composition-prototypes/current-vs-reference.png)

The simplified background removes two conspicuous pots and their nearby plant
detail, which reduces competition around the Rudbeckia. The sky treatment gives
the upper opening a clearer sunset cue, though its bright glow may need to be
weaker if combined with the simplified background. Prefer the simplified
background as the first production candidate, then tune the sky against it.

## Acceptance

- The Rudbeckia reads first at thumbnail size, with the bee and web still legible.
- The sky makes the upper background feel like late afternoon and does not
  compete with the flower.
- The scene retains clear visual separation between flower, patio, and garden
  background.
- No change is made to UV colors, textures, petal faces, or scientific copy.

## Validation

Built both throwaway variants and captured them at the existing 1456x819 desktop
viewport in Chromium with SwiftShader. Both pages reached the ready canvas with
no page or console errors. The production application checks in `AGENTS.md`
remain for the implementation step.

## Unresolved

- Whether the sky should be a simple color gradient or include a faint horizon
  glow remains open; the current prototype uses a faint radial glow.
- The user has not yet selected or visually accepted a treatment.
- No composition change has been implemented in production.
