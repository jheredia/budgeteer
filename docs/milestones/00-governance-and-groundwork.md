# M0 Governance and groundwork

## Scope

M0 delivers a safe, operationally governed repository through canonical product, architecture, security, roadmap, ADR, and milestone records. It excludes application scaffolding, provider integration, data persistence, and unresolved product decisions. This corrective continuation applies the approved 2026-10-22 direction.

## Acceptance criteria

- [x] Real `.eml` and `.emlx` files, credentials, local databases, logs, and build artifacts are ignored; only the explicitly named synthetic fixture subtree permits synthetic email files.
- [x] README and operating contract state the purpose, current status, authority, roles, protocols, approval boundaries, and privacy rules.
- [x] Product, architecture, and security records capture approved direction and unresolved choices.
- [x] Roadmap defines milestone completion and M0–M7 as usable vertical outcomes with accurate statuses.
- [x] Accepted ADRs record the generic workspace, evidence-versus-ledger, and raw-email lifecycle decisions.
- [x] Milestone template and durable handoff avoid a self-referential final commit hash.

## Verification

- `git diff --check`: passed.
- Safe `git check-ignore` checks: a private `.eml` path is ignored; a synthetic fixture `.eml` path is not ignored. No real message was created or opened.
- Local Markdown link targets validated.
- Reviewed the committed change for secrets, PII, raw email content, real email filenames, and application code; none included.

## Risks and open questions

- Mailbox provider, protocol, secret manager, encryption implementation, retention schedule, and provider-side deletion recovery design remain unresolved.
- Future work must meet the accepted temporary raw-email lifecycle and obtain explicit packet authorization before processing a real local email. Provider mail must not be automatically deleted.
- The initial source checkout contains real ignored email samples. This work neither reads nor alters them. The synthetic subtree relies on contributors following its synthetic-only rule.

## Current state and handoff

- Status: under review on branch; not merged or released.
- Branch: `codex/m0-governance-corrections`, based on `codex/m0-governance-groundwork` at stable deliverable commit `4f1c220` (`docs: establish M0 governance groundwork`). The correction commit is identified by Git history, not a self-reference here.
- Changed files in this correction: `.gitignore`, `AGENTS.md`, `README.md`, `docs/product.md`, `docs/security-and-privacy.md`, `docs/roadmap.md`, `docs/milestones/_template.md`, and this file.
- Verification: whitespace, safe ignore behavior, local Markdown links, and committed diff privacy/scope review as recorded above.
- Decisions: The user-approved vertical roadmap, completion standard, synthetic-only fixtures, and explicit authorization for future real local email processing apply. ADRs 0001–0003 remain accepted.
- Risks: See open questions above; no application code or real data is included.
- Exact next action: Overseer reviews the correction commit and open questions, then decides the M0 integration and M1 assignment; do not merge without direction.

## Change log

| Date | Change | Owner |
| --- | --- | --- |
| 2026-09-16 | Created and verified M0 governance and documentation groundwork. | M0 milestone task |
| 2026-10-22 | Corrected milestone outcomes, completion standard, privacy and fixture policy, and handoff. | M0 milestone task |
