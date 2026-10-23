# Overseer handoff

## Purpose and authority

This record transfers Budgeteer coordination from the local **Budgeteer — Overseer** task to one **Budgeteer — Cloud Overseer** task so the same coordinating task can be reopened across computers. It is a state snapshot and bootstrap guide; it does not override the authority order in `AGENTS.md`, accepted ADRs, or approved milestone scope.

There must not be two active Overseers. The Cloud Overseer becomes authoritative after it checks out the current `origin/master`, completes the acceptance checks below, and explicitly acknowledges the handoff. The local Overseer must then stop coordinating milestones and remains historical context only.

## Repository state being transferred

- Repository: `jheredia/budgeteer` (`https://github.com/jheredia/budgeteer`).
- Default branch: `master`.
- Manual planning board: `https://github.com/users/jheredia/projects/4`.
- M0 is accepted, complete, and published to `origin/master`.
- No application code, production stack, database, authentication, mailbox connection, or persistent model has been approved or scaffolded.
- No `.eml` or `.emlx` file is tracked. Real local email samples are outside the Cloud environment and must never be copied, committed, pushed, logged, or quoted.
- Cloud work is limited to committed repository content. It is not authorized to access Gmail, any local mailbox, local real-email samples, or raw financial messages. M1 uses synthetic structured data only.
- Accepted decisions are ADRs 0001–0003: generic workspaces, evidence separate from the canonical ledger, and transient raw email with no automatic provider deletion.

## Workflow state

- M1 has been launched through its proposal phase only.
- Its six candidate items are recorded in `docs/milestones/01-product-and-ux-prototype.md`.
- The proposal has not passed final Overseer contention.
- The user has not yet received the final manual GitHub Project list.
- No M1 Project setup confirmation or implementation authorization exists.
- No M1 code, scaffold, design artifact, implementation branch, or production architecture decision exists.

## Cloud Overseer acceptance checklist

Before directing work, the Cloud Overseer must:

1. Read `AGENTS.md`, accepted ADRs, `docs/product.md`, `docs/architecture.md`, `docs/security-and-privacy.md`, `docs/roadmap.md`, and the M0 and M1 milestone records.
2. Confirm the checkout is based on current `origin/master`, inspect Git status and recent history, and report any discrepancy before editing.
3. Confirm that no email files are tracked and that the privacy exclusions remain intact without opening any real email.
4. Restate that M1 implementation is unauthorized and that GitHub Project mutations are manual.
5. Accept the single-Overseer role and treat this local task as retired from coordination.

## Exact continuation

The Cloud Overseer's first product action is the pending M1 contention pass:

1. Review the six candidates in the M1 record for user-visible outcomes, non-overlapping scope, acyclic dependencies, observable acceptance criteria, and a coherent milestone result.
2. Amend or approve them, retaining the recorded contention unless there is a concrete reason to change it.
3. Give the user a concise, copyable list for manual creation in GitHub Project iteration M1, including suggested Priority, Size, and Estimate.
4. Wait for the user to confirm that the items exist.
5. Only then authorize M1 implementation on a dedicated branch and coordinate code, review, and delivery under `AGENTS.md`.

The Cloud Overseer must not recreate M0, reopen real emails, automate the GitHub Project, or begin M1 implementation during bootstrap.

## Handoff status

- Outgoing authority: Budgeteer — Overseer, local task.
- Incoming authority: Budgeteer — Cloud Overseer, to acknowledge after Cloud bootstrap.
- Prepared: 2026-10-23.
- Acceptance: pending Cloud Overseer acknowledgement.
