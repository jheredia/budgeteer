# Budgeteer

Budgeteer is a privacy-conscious personal finance product that tracks and categorizes expenses, presents a clear spending picture, and offers cautious, evidence-backed comparisons and insights. Email ingestion helps create user-reviewed financial records; it is a means to that end. Its workspace boundary is generic: a workspace may have one member or multiple members.

## Current status

M0 is accepted, complete, and published to `origin/master`. M1 now delivers a locally runnable, connected Spanish (Chile) prototype using synthetic structured in-memory data and the selected option 2 with mostly green colors. Browser journeys, responsive widths, and primary keyboard interactions are verified. M1 is ready for user review; final acceptance remains pending. No production stack, persistence, authentication, ingestion, or mailbox integration has been introduced.

Run instructions: [prototype/README.md](prototype/README.md). Scope and verification: [M1 milestone](docs/milestones/01-product-and-ux-prototype.md), [design QA](design-qa.md), and [Overseer audit](docs/design/m1/audit.md). Work is local on `codex/m1-product-ux-prototype`; no push or merge has been performed.

## Canonical documentation read order

1. `AGENTS.md`
2. Accepted ADRs in `docs/adr/`
3. The applicable milestone file in `docs/milestones/`
4. `docs/product.md`, `docs/architecture.md`, and `docs/security-and-privacy.md`
5. `docs/roadmap.md`
6. `docs/overseer-handoff.md` and informal handoff notes

When sources conflict, follow the authority order in `AGENTS.md`; do not silently reconcile a conflict.

## Development status

M0 establishes the repository contract and the privacy boundary for future work. M1 is implemented and awaiting user review; M2–M7 remain planned. Internal milestone agents coordinate directly with the single Overseer under `AGENTS.md`. Contributors should begin by reading the documents above, work within an approved milestone packet, and keep raw email out of the repository, logs, and durable application storage.
