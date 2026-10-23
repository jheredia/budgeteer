# M1 Product and UX prototype

- Status: proposal ready; awaiting Overseer decision and user Project setup
- Owner task: Budgeteer — Cloud Overseer after handoff acceptance
- Dependencies: M0 complete
- Implementation authorization: not granted

## Demonstrable outcome

A reviewer can run one coherent, responsive, interactive Spanish (Chile) prototype using synthetic in-memory data and complete the overview, ledger, evidence, transaction-review, and source-status journeys.

## Scope

- In scope: Spanish (Chile), CLP, `America/Santiago`, mobile and desktop layouts, connected prototype journeys, visible uncertainty and provenance, source/privacy status, and fully synthetic in-memory state.
- Out of scope: Real email or financial data, email files, mailbox connections, ingestion, backend services, persistence, authentication, production insight algorithms, production runtime or hosting decisions, and logo redesign.

## Project item proposal

The M1 task proposed the following candidate items. They are not yet approved Project items.

### 1. Establish the prototype direction and navigation

- Outcome: A coherent Spanish-language shell and reviewable visual direction across the M1 journeys.
- Acceptance: A reviewer can navigate every journey at mobile and desktop widths; CLP, dates, and language follow Chilean conventions; accessible interaction foundations are present; the user reviews the direction before it is applied throughout the prototype.
- Dependencies: None.
- Suggested fields: Priority High; Size M; Estimate 3.

### 2. Explore monthly spending and comparisons

- Outcome: A monthly overview with a cautious, evidence-backed comparison.
- Acceptance: A reviewer can select a represented month, compare it with another represented period, understand the comparison basis and limitations, and follow displayed values to supporting synthetic ledger records.
- Dependencies: The approved visual direction and shared synthetic state.
- Suggested fields: Priority High; Size M; Estimate 5.

### 3. Review an uncertain transaction

- Outcome: A complete journey for inspecting, categorizing, and approving or ignoring an uncertain proposed transaction.
- Acceptance: Approval adds the proposal to the in-memory ledger and updates relevant totals; ignoring removes it from the pending queue without creating a ledger record; both outcomes are explicit and reversible by reloading the documented prototype state.
- Dependencies: The approved visual direction, shared synthetic state, and agreed evidence presentation.
- Suggested fields: Priority High; Size L; Estimate 8.

### 4. Browse and filter the canonical ledger

- Outcome: A usable ledger clearly separated from pending proposals and evidence.
- Acceptance: A reviewer can browse, filter by an approved minimal set, clear filters, open a record, and see totals remain consistent with the current in-memory state; pending and ignored proposals never appear as canonical entries.
- Dependencies: The approved visual direction and shared synthetic state.
- Suggested fields: Priority High; Size M; Estimate 5.

### 5. Inspect transaction provenance

- Outcome: A detail view that distinguishes a canonical record from its minimized structured evidence and uncertainty.
- Acceptance: A reviewer can reach provenance from both a pending proposal and an approved ledger record; no raw message content or full account identifier appears; unavailable or uncertain fields are explicit.
- Dependencies: The approved visual direction and shared synthetic state.
- Suggested fields: Priority High; Size M; Estimate 3.

### 6. Explain simulated source and privacy status

- Outcome: A source-status experience that is honest about simulation and explains the accepted raw-email lifecycle without implying a live integration.
- Acceptance: The interface labels every source as simulated, states that Budgeteer does not permanently store raw email or automatically delete provider mail, and avoids claiming that synchronization, authentication, or provider controls exist.
- Dependencies: The approved visual direction.
- Suggested fields: Priority High; Size S; Estimate 3.

- Overseer decision: pending
- User Project setup: pending

## Overseer contention to resolve

- Keep integrated launch instructions, responsive checks, keyboard checks, and the complete end-to-end acceptance pass in the milestone Definition of Done rather than hiding them inside item 6.
- Replace the proposal's circular cross-item dependencies with one shared synthetic-state contract established during implementation; feature items should depend only on that contract and the approved visual direction.
- Treat comparisons as a transparent UX demonstration, not as the M5 production insight engine.
- Treat review actions, evidence structure, and sync states as prototype hypotheses, not approved production domain decisions.
- Require the visual-direction checkpoint after one representative mobile and desktop surface and before broad implementation.

## Acceptance criteria

- [ ] The user approves the visual direction at the defined checkpoint.
- [ ] The locally runnable prototype connects all approved journeys rather than presenting disconnected screens.
- [ ] Every displayed transaction and comparison uses synthetic in-memory data shared consistently across journeys.
- [ ] The prototype clearly distinguishes proposed records, canonical ledger entries, and minimized evidence.
- [ ] A reviewer can complete approve and ignore paths and see their effects on the queue, ledger, and overview.
- [ ] The interface remains usable at representative mobile and desktop widths and supports keyboard operation for its primary journey.
- [ ] Local launch instructions, verification results, limitations, and outstanding product decisions are recorded.
- [ ] No email file, real financial data, backend, persistence, mailbox connection, or production stack decision is introduced.

## Verification

Not started. M1 is still in proposal review and no application code or design artifact has been authorized.

## Risks and open questions

- The minimum useful ledger filters and comparison explanation require user review during M1.
- The prototype must communicate evidence versus ledger without accidentally establishing an unapproved production schema or review lifecycle.
- A reversible prototype implementation choice will be necessary, but it must not silently become the production runtime decision.
- The existing logo may be used as a placeholder; visual identity work remains out of scope.

## Current state and handoff

- Branch and stable deliverable commits, if useful: M1 implementation branch does not exist; start from the current `origin/master` only after authorization.
- Approved Project items: None. The six entries above are candidates pending Overseer contention.
- Changed files: No M1 implementation files.
- Verification: Proposal only; no product verification performed.
- Decisions: Locale, responsive target, synthetic in-memory data, complete connected prototype, and the listed exclusions are proposed boundaries consistent with the roadmap and accepted ADRs.
- Risks: See open questions and contention above.
- Exact next action: The Cloud Overseer reviews and finalizes the candidate items, then gives the user the exact manual GitHub Project list. Do not implement until the user confirms creation and the Overseer explicitly authorizes M1.

## Change log

| Date | Change | Owner |
| --- | --- | --- |
| 2026-10-23 | Recorded the proposal produced by the M1 task and the unresolved Overseer contention for Cloud continuation. | Budgeteer — Overseer |
