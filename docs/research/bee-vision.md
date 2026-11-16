# A floral UV contrast for the first experiment

Researched 2026-11-16. Scope is one signal, not a simulation of animal experience.

## Intended lesson

Two petal regions that look similarly yellow to us can differ in UV reflectance,
providing a contrast available to a honeybee's visual system.

Use *Apis mellifera* as the sensory reference and a schematic floral head based
on *Rudbeckia hirta*. This pairing illustrates documented capabilities and a
documented floral pattern. It does not reproduce an experiment testing this
specific bee species on this specific flower.

## Evidence and limits

| Primary source | Species and observation | Limit for this experiment |
| --- | --- | --- |
| [Peitsch et al., 1992, spectral input systems](https://pubmed.ncbi.nlm.nih.gov/1573568/), DOI 10.1007/BF00190398 | Intracellular recordings across 43 hymenopteran species establish spectral receptor sensitivities, including UV sensitivity. | The accessible abstract summarizes the whole sample. Its population peaks are not species-specific honeybee values. |
| [Reser et al., 2012, honeybee color discrimination](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0048577), introduction and behavioral experiment | *A. mellifera* has UV, blue, and green receptors. The introduction cites peaks near 344, 436, and 544 nm from earlier physiology. Their own experiment demonstrates learned discrimination of 414 and 424 nm stimuli under differential conditioning. | Receptor peaks are not sharp visibility boundaries. The experiment does not measure floral UV patterns or subjective colors. |
| [Thompson et al., 1972, flavonols and UV absorption](https://pubmed.ncbi.nlm.nih.gov/5050486/), DOI 10.1126/science.177.4048.528 | In *R. hirta*, UV-absorbing flavonol compounds occur at petal bases, with absorption at 340 to 380 nm. The abstract describes the UV pattern as invisible to us. | Abstract inspected. Chemical evidence does not specify a display palette or quantify bee behavior. Human comparison refers to ordinary unaided viewing. |
| [Horth, Campbell, and Bray, 2014, floral guides](https://pmc.ncbi.nlm.nih.gov/articles/PMC4001241/), Fig. 1 and floral-specimen methods, DOI 10.1242/bio.20146445 | In *R. hirta*, basal petal regions absorb UV while distal regions reflect it. Both look yellow to humans. UV images and reflectance spectra document the contrast. Experiments on *R. hirta* and *R. fulgida* associate manipulated guide size with visitor frequency. | Guide size varies. Visitors comprise multiple insect groups. This does not establish a universal honeybee preference or isolate every possible effect of petal manipulation. |
| [Schlangen et al., 2009, formation of UV guides](https://pubmed.ncbi.nlm.nih.gov/19477473/), DOI 10.1016/j.phytochem.2009.04.017 | *R. hirta* studied with UV photography, reflectance spectroscopy, and chemical analyses. The abstract reports that petal backs remain UV-reflecting throughout anthesis. | Abstract inspected. Do not copy the front-face basal pattern onto the back as if measured. |

The selected contrast is supported by floral measurements and bee receptor
evidence. Its availability to the honeybee visual system is an inference from
those sources, not a new behavioral finding. Detection at a particular viewing
distance, under particular light, is outside this brief.

## Proposed display encoding

These are design proposals, not biological findings.

- Human reference shows yellow petal-like structures around a dark central disk.
  Botanically, the head contains multiple florets, as described by Horth et al.
- Bee signal mode distinguishes the basal and distal regions of the upper petal
  surfaces. Label the base as absorbing more UV and the tip as reflecting more UV.
  The basal pattern must extend onto the petals beyond the already dark disk.
- Use visible false colors or a labeled overlay. Keep the exact palette tentative
  until it can be compared in the prototype. Avoid making absorption look like
  emitted light.
- Keep geometry and camera fixed when switching. Pattern extent and geometry
  are schematic, with no claim of measured proportions or calibrated reflectance.
- Do not infer a UV map from an RGB photograph. Do not apply the upper-surface
  pattern to the underside. A quantitative receptor model would require spectral
  reflectance, illumination, receptor curves, and adaptation assumptions.

An ordinary RGB display can encode the distinction for a human viewer, but cannot
reproduce bee perception. UV photography alone also does not reproduce a bee's
combined receptor responses. No compound-eye mosaic, global color filter, blur,
or claim about the bee's subjective colors is justified by this experiment.

## Draft Spanish interface text

- Control labels: "Referencia humana" and "Contraste UV para una abeja".
- Lesson: "Dos zonas de estos pétalos pueden parecernos amarillas y reflejar
  distinta cantidad de ultravioleta. La abeja melífera tiene receptores sensibles
  al UV." Sources are Thompson et al., Horth et al., and Reser et al.
- Legend: "Base: mayor absorción UV. Extremo: mayor reflexión UV." Source is
  Horth et al. This describes relative regions, not calibrated values.
- Limit: "Patrón esquemático basado en Rudbeckia hirta. Los colores representan
  el contraste UV. No reproducen lo que experimenta una abeja."

The local prototype retains violet bases and yellow tips after browser inspection
of trial palettes. This is a display decision, not a scientific measurement.
Whether visitors understand the comparison remains untested.
The stack comparison is complete in [Decisions](../../DECISIONS.md).
