# Budgeteer

Budgeteer is a privacy-conscious personal finance product that tracks and categorizes expenses, presents a clear spending picture, and offers cautious, evidence-backed comparisons and insights. Email ingestion helps create user-reviewed financial records; it is a means to that end. Its workspace boundary is generic: a workspace may have one member or multiple members.

## Current status

M0 is accepted, complete, and published to `origin/master`, with user approval on 2026-10-22 and explicit push authorization on 2026-10-23. The project has not been released. M1 implementation was explicitly authorized on 2026-10-23. Option 2 was selected with mostly green colors; representative review-surface source exists in `prototype/` but is unverified after sandbox server-start failures. Work is paused to resolve the separate milestone-conversation handoff. No persistent data model exists. The approved scope, checkout exception, and next action are recorded in `docs/milestones/01-product-and-ux-prototype.md` and `docs/overseer-handoff.md`.

## Canonical documentation read order

1. `AGENTS.md`
2. Accepted ADRs in `docs/adr/`
3. The applicable milestone file in `docs/milestones/`
4. `docs/product.md`, `docs/architecture.md`, and `docs/security-and-privacy.md`
5. `docs/roadmap.md`
6. `docs/overseer-handoff.md` and informal handoff notes

When sources conflict, follow the authority order in `AGENTS.md`; do not silently reconcile a conflict.

## Development status

M0 establishes the repository contract and the privacy boundary for future work. M1–M7 are planned only. Contributors should begin by reading the documents above, work within an approved milestone packet, and keep raw email out of the repository, logs, and durable application storage.
