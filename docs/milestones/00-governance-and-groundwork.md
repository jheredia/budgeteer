# M0 Governance and groundwork

## Scope

M0 delivers a safe, operationally governed repository through canonical product, architecture, security, roadmap, ADR, and milestone records. It excludes application scaffolding, provider integration, data persistence, and unresolved product decisions. This corrective continuation applies the approved 2026-10-22 direction.

## Acceptance criteria

- [x] All `.eml` and `.emlx` files are ignored everywhere, without exception; no real, redacted, or synthetic email files may be committed or pushed. Credentials, local databases, logs, and build artifacts are also ignored.
- [x] Parser tests use fully synthetic messages constructed in memory at runtime or non-email structured inputs; email-file fixtures are not stored in Git.
- [x] README and operating contract state the purpose, current status, authority, roles, protocols, approval boundaries, and privacy rules.
- [x] Product, architecture, and security records capture approved direction and unresolved choices.
- [x] Roadmap defines milestone completion and M0–M7 as usable vertical outcomes with accurate statuses.
- [x] Accepted ADRs record the generic workspace, evidence-versus-ledger, and raw-email lifecycle decisions.
- [x] The operating contract requires an Overseer-reviewed item proposal, manual user Project setup, user confirmation, and explicit Overseer release before milestone implementation begins, and it states the milestone Definition of Done.
- [x] The milestone template records approval, outcome, scope, verification, and handoff without a self-referential final commit hash.
- [x] Architecture distinguishes discussed stack recommendations from approved decisions.

## Verification

- `git diff --check`: passed.
- Safe `git check-ignore` checks: both private and synthetic fixture `.eml` paths are ignored. No real message was created or opened.
- `git ls-files` confirmed no `.eml` or `.emlx` files are tracked on the branch.
- Local Markdown link targets validated.
- Reviewed the committed change for secrets, PII, raw email content, real email filenames, and application code; none included.

## Risks and open questions

- Mailbox provider, protocol, secret manager, encryption implementation, retention schedule, and provider-side deletion recovery design remain unresolved.
- Future work must meet the accepted temporary raw-email lifecycle and obtain explicit packet authorization before processing a real local email. Provider mail must not be automatically deleted.
- The initial source checkout contains real ignored email samples. This work neither reads nor alters them. Ignore rules do not prevent a forced add; contributors must enforce the no-email-file policy.

## Current state and handoff

- Status: accepted/complete; explicitly reviewed and approved by the user, integrated into local `master` on 2026-10-22, and published to `origin/master` after explicit user authorization on 2026-10-23. The project is not released.
- Branch: `codex/m0-governance-corrections`, based on `codex/m0-governance-groundwork` at stable deliverable commit `4f1c220` (`docs: establish M0 governance groundwork`). Prior corrections include `9584bcf`, `d1c1f80`, and `62adf48`. The acceptance bookkeeping commit is identified by Git history, not a self-reference here.
- Changed files in the acceptance bookkeeping: `README.md`, `docs/roadmap.md`, and this file. Earlier deliverable changes are recorded in Git history.
- Verification: whitespace, safe ignore behavior, local Markdown links, and committed diff privacy/scope review as recorded above.
- Decisions: The user-approved vertical roadmap, completion standard, the prohibition on committing or pushing any email files, synthetic in-memory parser tests, explicit authorization for future real local email processing, and milestone packet approval gate apply. Stack recommendations discussed in chat are not accepted ADRs. ADRs 0001–0003 remain accepted.
- Risks: See open questions above; no application code or real data is included.
- Exact next action: The Cloud Overseer accepts the repository handoff, completes contention of the existing M1 proposal, and presents the final item list to the user for manual GitHub Project creation. M1 implementation remains unauthorized until the user confirms those items are ready.

## Change log

| Date | Change | Owner |
| --- | --- | --- |
| 2026-09-16 | Created and verified M0 governance and documentation groundwork. | M0 milestone task |
| 2026-10-22 | Corrected milestone outcomes, completion standard, privacy and fixture policy, and handoff. | M0 milestone task |
| 2026-10-22 | Added the user approval gate and operating Definition of Done; clarified the template and undecided stack. | M0 milestone task |
| 2026-10-22 | Applied the user veto on all committed or pushed email files and specified in-memory synthetic parser tests. | M0 milestone task |
| 2026-10-22 | Recorded explicit user approval and acceptance; local integration assigned to the Overseer, with no GitHub push authorized. | M0 milestone task |
| 2026-10-22 | Integrated the accepted M0 branch into local `master`; no GitHub push was performed. | Budgeteer — Overseer |
| 2026-10-22 | Replaced attempted Project automation with the approved proposal, manual Project setup, implementation, review, and delivery workflow. | Budgeteer — Overseer |
| 2026-10-23 | Published the reviewed M0 state to `origin/master` after explicit user authorization for the Codex Cloud transition. | Budgeteer — Overseer |
