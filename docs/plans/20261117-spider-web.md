# A second signal in the patio

## Question

Can a spider and an interactive web make the existing patio more engaging by
letting visitors locate an event through a different sensory signal?

## Smallest experiment

Keep the flower and add one schematic horizontal web with a spider in the same
Three.js scene. Offer a second camera destination. At the web, compare a human
reference with an explanatory vibration encoding. Visitors can touch distinct
web locations, then summon a fly and locate it by the strongest highlighted
radial direction. Provide keyboard and touch equivalents.

## Selected design

- `src/main.ts` retains camera, DOM controls, and the render scheduler.
- `src/spider-web.ts` owns geometry and signal/challenge state. Use a
  discriminated union for exploring, searching, and found states, and a small
  fixed direction table shared by hit testing and accessible buttons.
- Keep flower `View` separate from web representation. No global animal
  registry or second renderer. Animation runs only during travel or a bounded
  pulse. Reduced motion uses a persistent static signal.
- Compare two candidates before implementation. A generic destination
  controller offers reuse but broadens the change. A bounded web module with
  an added camera target fits this experiment. Independent reviewers will
  resolve the contract and check the plan before code.

## Acceptance criteria

1. Flower and web coexist in the patio. Both destinations and return work.
2. Different web points create visibly different signals. Drag never triggers
   a touch signal or a destination change.
3. Human and vibration modes preserve the web camera. A fly challenge offers
   wrong-answer feedback, success, replay, and no accidental answer leak in
   the challenge prompt or accessible button names.
4. Keyboard and touch can complete the experience. Web controls and the scene
   fit the first screen at 1440×1000 and 390×844 without covering the canvas.
5. Reduced motion retains the directional information without animation.
   Context loss cancels travel and pulses and leaves no stale work on restore.
6. Existing bee comparisons, reverse-petal rendering, travel cancellation,
   fallback, and external-asset checks continue to pass.
7. The lesson cites the research brief and distinguishes documented capability,
   display encoding, and schematic choices.

## Validation

Run `npm run typecheck`, `npm run build`, and `npm run check:browser`.
Extend Playwright with web signals at multiple points, both modes, wrong and
correct guesses, replay, camera return, keyboard, touch, reduced motion, and
context loss. Save desktop and mobile screenshots in `test-results/patio/` and
inspect them. This does not establish physical-phone performance or learning.

## Throughput checkpoint

- Blocking first steps. Inspect camera and test contracts, research one bounded
  signal, and independently review the plan before implementation.
- Independent workstreams. Read-only design alternatives run in parallel.
  One implementation owner handles the coupled scene, UI, and browser checks.
- Shared mutable state. The owner writes in an isolated worktree. Camera and
  animation scheduling have one owner. Reviewers do not modify files.
- Smallest safe decomposition. One implementation owner prevents competing
  edits to `main.ts` and keeps lifecycle handling consistent.

## Unresolved choices

Exact web position, camera framing, and compact control placement require
browser evidence. Palette and pulse timing are explanatory design choices.
No deployment, commit, or pull request is requested.

## Independent review and accepted contract

Two read-only design explorers compared integrated camera travel with a separate
web panel and module-owned animation. The gpt-6-luna cross-judge selected the
integrated camera with a domain-only web module. The gpt-6-astra plan reviewer
required these clarifications, accepted before implementation:

- `main.ts` owns the only RAF handle, DOM, and motion-preference listener.
  The web exposes `update(now, reducedMotion): boolean` and no timers/listeners.
- Use four numbered sectors with visible labels attached to web locations and
  matching accessible buttons derived from one exported table.
- Hide prey in both representations while searching. Mode switching retains
  the round and camera. Reveal the insect on success. Human mode explains how
  to enable the signal representation.
- Leaving the web or losing context clears pulses and unfinished rounds.
  Enabling reduced motion during a pulse immediately settles the static cue.
- Test switching during searching, motion changes during a pulse, departure
  during a pulse, and context loss during searching.

The design follows Model the Domain by keeping challenge phases in a union.
Prove It Works requires rendered browser evidence before declaring completion.

## Implementation and verification

Completed on 2026-11-17. One owner implemented the scene, UI, and checks in an
isolated worktree. The reviewed files were copied byte-for-byte into the shared
checkout. The fixed web camera preserves numbered-sector alignment. Contextual
lessons and species headings switch with the destination.

Independent code review found a mobile heading overlap and a context-loss test
that waited until its pulse ended. Both were corrected. The heading now grows
with its content, with bounds and edge-occlusion assertions. Context-loss probes
hold only test RAF timestamps so real asynchronous WebGL loss interrupts an
active pulse or travel. Application timing is unchanged.

`npm run typecheck`, `npm run build`, and `npm run check:browser` passed in the
shared checkout. On this Linux host the browser command used
`LD_LIBRARY_PATH=/tmp/umwelt-browser-libs/extracted/usr/lib/x86_64-linux-gnu` for
existing local Chromium libraries. No system libraries were installed.

The extended browser check covers all acceptance criteria through actual scene
clicks at distinct locations, keyboard and emulated touch, wrong and correct
answers, replay, new rounds, representation changes, reduced-motion changes,
departure, and context loss during pulse/search/travel. Five idle checks confirm
unchanged RAF and WebGL draw counters after settling. Existing bee and petal-back
checks remain green, with zero page/console errors and external requests.

Evidence is saved in `test-results/patio/verification.json`, `interaction.webm`,
`web-vibrations-desktop.png`, `web-vibrations-mobile.png`, and
`web-found-human-desktop.png`. Final desktop and mobile images were inspected.
Web control bars end at 985.84px and 788.38px respectively, with no horizontal
overflow or sampled occluders. Physical-device performance and visitor
comprehension remain untested. No deployment or PR was performed.

Follow-up: the user requested committing and pushing the completed increment
to `origin/main` after validation. This does not deploy the application.
