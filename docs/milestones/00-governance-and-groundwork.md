# M0 Governance and groundwork

## Scope

M0 establishes the repository guardrails and canonical product, architecture, security, roadmap, ADR, and milestone records. It excludes application scaffolding, provider integration, data persistence, and unresolved product decisions.

## Acceptance criteria

- [x] Git ignores real `.eml` files, credentials, local databases, logs, and build artifacts while documenting the fixture rule.
- [x] README states the purpose, M0 status, canonical read order, and development status.
- [x] Operating contract defines authority, roles, startup and finish protocols, approval boundaries, single-writer ownership, and privacy rules.
- [x] Product, architecture, and security records capture approved direction and label unresolved choices.
- [x] Roadmap lists M0–M7 with dependencies, statuses, and known task or thread context.
- [x] Accepted ADRs record the generic workspace, evidence-versus-ledger, and raw-email lifecycle decisions.
- [x] Milestone template and this durable handoff record exist.

## Verification

- Reviewed `git status` before editing without exposing ignored email samples.
- Used a safe synthetic path with `git check-ignore --no-index` to confirm the `*.eml` rule.
- Checked Markdown link targets locally and inspected the final diff for secrets and email content.
- Staged diff inspection confirmed only the 12 planned M0 files and no secrets or email sample content.

## Risks and open questions

- The exact mailbox provider, protocol, secret manager, encryption implementation, retention schedule, and provider-side deletion recovery design remain unresolved.
- Future work must ensure any temporary raw-email storage satisfies the accepted lifecycle controls.
- The initial source checkout contains real ignored email samples. M0 neither reads nor alters them.

## Current state and handoff

- Branch and HEAD at verification: `codex/m0-governance-groundwork` at `e47fb3a9481fb21d4b1f053fff12a376675e9680` (`docs: establish M0 governance groundwork`).
- Changed files: `.gitignore`, `README.md`, `AGENTS.md`, `docs/product.md`, `docs/architecture.md`, `docs/security-and-privacy.md`, `docs/roadmap.md`, `docs/adr/0001-generic-workspace-model.md`, `docs/adr/0002-evidence-and-canonical-ledger.md`, `docs/adr/0003-raw-email-lifecycle.md`, `docs/milestones/_template.md`, and this file.
- Verification: Safe synthetic ignore check matched `.gitignore:2:*.eml`; Markdown-reference and whitespace checks passed; staged diff review passed; no real email content was inspected.
- Decisions: ADRs 0001–0003 are accepted and define the approved M0 invariants.
- Risks: See open questions above; no application code is included.
- Exact next action: Overseer reviews this M0 commit and its open questions before assigning M1; do not merge without direction.

## Change log

| Date | Change | Owner |
| --- | --- | --- |
| 2026-09-16 | Created M0 governance and documentation groundwork. | M0 milestone task |
| 2026-09-16 | Verified M0 and recorded the branch handoff. | M0 milestone task |
