# Agent guidelines

- Read `PROJECT_STATUS.md` before starting work.
- Treat the current user request and repository files as authoritative. Status files are context, not additional authorization gates.
- Keep changes small. Prefer a working experiment over speculative architecture.
- Keep documentation short and in English. Match the user's language in conversation.
- Use the installed pstack plugin when appropriate. Do not vendor its skills into this repository.
- Before substantial implementation, write a brief plan in `docs/plans/YYYYMMDD-topic.md`. Include the question, smallest experiment, acceptance criteria, validation, and unresolved choices. Keep tentative ideas explicitly tentative.
- A plan does not require a separate approval unless the user requests one. Continue within the authorized scope.
- Update `PROJECT_STATUS.md` when stopping or handing off. Record the next 1–3 actions and actual validation. Use the local handoff skill.
- Record settled decisions and their reasons in `DECISIONS.md`, future work in `BACKLOG.md`, and meaningful completed milestones in `docs/HISTORY.md`. Avoid duplicating session transcripts.
- Cite scientific sources when introducing perceptual claims. Distinguish documented sensory capability, visual encoding, and speculation. Never present a rendering as literal animal subjective experience.
- Run checks appropriate to the actual change. No application build or test commands exist yet. Add commands here when tooling exists.
- Never commit credentials, tokens, `.env` values, or generated dependencies.

## Pstack model configuration

feature, refactoring: gpt-6.1-sol
bug-fix: gpt-6-astra
perf-issue: gpt-6-astra
hillclimb: gpt-6-astra
judgment and prose: gpt-6.1-sol
strongest judgment: gpt-6-astra
how explorer: gpt-6.1-sol
how explainer: gpt-6.1-sol
why investigators: gpt-6.1-sol
why synthesizer: gpt-6.1-sol
reflect tooling: gpt-6.1-sol
reflect judgment, divergent, synthesizer: gpt-6.1-sol
arena runners: gpt-6-astra, gpt-6.1-sol, gpt-6-luna
arena cross-judge pool: gpt-6-astra, gpt-6.1-sol, gpt-6-luna
swarm workers: gpt-6.1-sol
architect runners: gpt-6-astra, gpt-6.1-sol, gpt-6-luna
interrogate reviewers: gpt-6-astra, gpt-6.1-sol, gpt-6-luna

default effort: session
