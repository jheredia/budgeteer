# M1 Product and UX prototype

- Status: paused for milestone-conversation handoff; representative surface source unverified
- Owner: `m1_implementation` agent, coordinated by Budgeteer — Overseer (Cloud)
- Branch: `codex/m1-product-ux-prototype`
- Dependency: M0 complete
- Authorization: user explicitly requested M1 implementation and a new agent on 2026-10-23. Manual Project-item creation has not been confirmed; this explicit instruction authorizes the start without asserting that setup occurred.
- Visual selection: user chose option 2 and requested Budgeteer's mostly green colors on 2026-10-23. Implementation is limited to one representative responsive review surface; approval of that implemented surface remains pending before broad UI work.

## Demonstrable outcome

A reviewer can run one coherent, responsive, interactive Spanish (Chile) prototype using synthetic structured in-memory data and complete overview, ledger, evidence, transaction-review, and source-status journeys. M1 is incomplete until this outcome is verified.

## Scope and exclusions

In scope: Spanish (Chile), CLP, `America/Santiago`, mobile and desktop layouts, keyboard operation, visible uncertainty and provenance, source/privacy explanations, one shared resettable in-memory state, and connected journeys.

Out of scope: real email or financial data; all email-file fixtures, including synthetic or redacted files; Gmail/local mailbox access; ingestion; backend services; persistence; authentication; mailbox connections; production insights; production runtime/hosting/database decisions; logo redesign. No real message was opened. All later domain structures and review behavior are prototype hypotheses, not accepted production decisions.

## Approved Project-item list

The Overseer completed contention and supplied this list. All entries use relative numeric estimates. Project mutations remain manual.

### 1. Establish prototype direction, navigation, and shared synthetic state

- Priority High; Size M; Estimate 3; Dependencies none.
- Outcome: coherent Spanish (Chile) foundation.
- Acceptance: select one of three generated visual directions; produce one representative mobile and desktop surface for user approval before broad UI implementation; define navigation across all five journeys and one shared resettable in-memory contract separating proposals, canonical entries, and minimized evidence; specify CLP, timezone, keyboard behavior, and visible focus.
- Status: option 2 selected with mostly green palette; generated green revision and representative review-surface source created. Official brand hex values are unavailable in tracked assets/docs or historical starter code, so provisional green tokens are documented explicitly. Work paused before browser verification; visual approval remains pending.

### 2. Explore monthly spending and comparisons

- Priority High; Size M; Estimate 5; Depends only on item 1, including visual approval.
- Outcome: understand a represented month's spending and a transparent comparison.
- Acceptance: select between at least two synthetic months; display canonical spending totals, comparison periods, calculation basis and limitations; link totals to matching ledger records; explicitly handle a zero comparison baseline; approval updates relevant values. Comparisons are a UX demonstration, not the M5 insight engine.

### 3. Review an uncertain transaction

- Priority High; Size L; Estimate 8; Depends only on item 1, including visual approval.
- Outcome: inspect, categorize, and approve or ignore a pending proposal.
- Acceptance: show uncertainty and access to shared evidence presentation; approval creates exactly one canonical entry, removes pending proposal, and updates totals; ignore removes pending proposal without creating an entry; repeated actions cannot duplicate entries; reload restores documented synthetic starting state.
- Ownership: review actions and state transitions; item 5 owns evidence presentation.

### 4. Browse and filter the canonical ledger

- Priority High; Size M; Estimate 5; Depends only on item 1, including visual approval.
- Outcome: find and inspect canonical transactions separately from proposals.
- Acceptance: browse records, combine month/category filters, clear filters, show meaningful empty state and total matching visible records, and open details. Pending and ignored proposals never appear as canonical entries.

### 5. Inspect transaction provenance

- Priority High; Size M; Estimate 3; Depends only on item 1, including visual approval.
- Outcome: distinguish a transaction from its supporting evidence.
- Acceptance: shared detail presentation reachable from pending and canonical entries; clearly separate record values, minimized structured evidence and uncertainty; unavailable fields explicit; masked hints only; no raw message bodies or sensitive headers; approval preserves supporting evidence access.

### 6. Explain simulated source and privacy status

- Priority High; Size S; Estimate 3; Depends only on item 1, including visual approval.
- Outcome: understand simulated sources and privacy boundaries.
- Acceptance: every source labeled simulated; explicitly no connected mailbox; explain no permanent raw-email retention and no automatic provider-mail deletion; do not imply working authentication, synchronization or provider controls.

## Integration and milestone acceptance

All feature items depend only on item 1; their shared contract avoids cyclic dependencies. Final integration connects them. Launch instructions, responsive/keyboard checks and end-to-end verification belong to the milestone Definition of Done rather than item 6.

- [x] User selects initial generated visual direction (option 2, mostly green).
- [ ] User approves representative implemented mobile and desktop surface before broad UI implementation.
- [ ] One locally runnable prototype connects all approved journeys.
- [ ] Synthetic in-memory state is shared consistently across every transaction and comparison.
- [ ] Proposals, canonical entries and minimized evidence are clearly distinct.
- [ ] Approve and ignore paths show correct queue, ledger, provenance and overview effects.
- [ ] Representative mobile/desktop widths and primary keyboard journey verified.
- [ ] Local launch/reset instructions, verification, limitations and outstanding product choices recorded.
- [ ] No excluded data, email file, production service or production-stack decision introduced.

## Bootstrap, decisions and verification

- Starting revision: `2c1ea668bd9122aa07afff3e5139bda7cdc6519c` on clean `work`.
- GitHub independently reported `master` at `2679cf0969666312877cd31e5afba379c907f319`, one documentation commit ahead. Fetch failed because the environment proxy was unavailable. The user explicitly directed continuation from the current commit. No ancestry claim or forced checkout was made.
- Governance documents missing from the local checkout were recovered via GitHub connector at that exact remote revision; the accepted handoff and this approved packet are recorded on the M1 branch.
- Single Overseer: Cloud Overseer accepted coordination; outgoing local Overseer retired. See [handoff](../overseer-handoff.md).
- Product Design index requires exactly three visual options and user selection before scaffolding when no visual target exists. Initial concepts explore overview-first, review-first and ledger-first hierarchy; each includes desktop and mobile treatments. They contain only synthetic structured illustrative data.
- No saved Product Design context or local visual assets were present. The referenced shared critical-overrides resource could not be read through the skill provider; no user-supplied visual reference was omitted.
- Prototype-only tooling: dependency-free HTML/CSS/JS and Node static file server in `prototype/`, not a production-stack decision. Only the representative review surface is in source; other journeys are not implemented.
- Verification so far: JavaScript syntax and whitespace checks passed; no tracked `.eml`/`.emlx` paths; safe `git check-ignore` confirms both extensions ignored. Startup failed with sandbox `listen EPERM` on both wildcard and loopback port 4173. No app behavior, responsive rendering, keyboard operation or browser console has been verified; root `design-qa.md` is blocked.

## Current handoff and exact next action

Work is paused by the Overseer to resolve the user's separate visible milestone-conversation requirement. The current agent is a subagent of the Overseer chat, not a separate user-visible milestone conversation. Preserve the branch and handoff; do not resume code, server or browser work until the Overseer releases it after coordination is resolved. Then resolve sandbox server permissions, verify only the representative surface, and return for visual approval before broad UI implementation. See `prototype/README.md` and root `design-qa.md`.

No Project item status has been changed. M1 remains in progress, not review-ready or complete.

## Change log

| Date | Change | Owner |
| --- | --- | --- |
| 2026-10-23 | Recovered proposal and handoff records; recorded explicit implementation authorization, user-authorized base exception, finalized item list and visual checkpoint. | M1 agent under Cloud Overseer |
| 2026-10-23 | Recorded option 2 selection and mostly green constraint; generated green revision and representative source; paused after startup permission failures for separate milestone-chat handoff. | M1 agent under Cloud Overseer |
