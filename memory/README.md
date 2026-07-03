# Project Memory (reference docs)

Local reference for the content-engine. Read these before working on the project (and the
ideation/review workflow reads `design-system.md` to stay on-brand).

> **These docs are an EXAMPLE reference build** (they describe how the original "byte.sized.2" channel
> was set up). They're kept as a worked example of the architecture and design system — they are NOT
> your config. Your channel's handle, niche, accounts, and keys all live in `../config.json`
> (copy `../config.example.json` to start). `design-system.md` is generic and worth keeping; the
> account-specific notes in the others are just illustrative.

- **[design-system.md](design-system.md)** — palette, fonts, motion, scene library, layout rules
  (the visual contract; impeccable + the renderer follow this).
- **[architecture.md](architecture.md)** — the pipeline, scripts, data flow, tooling.
- **[roadmap.md](roadmap.md)** — what's done and what's left to finish the automation.
- **[decisions.md](decisions.md)** — key decisions and gotchas (why things are the way they are).

Root files: `../PRODUCT.md` + `../DESIGN.md` give impeccable the project's product + design context.
Channel config: `../config.json`. Topic backlog: `../topics.json`.
