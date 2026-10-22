# Budgeteer operating contract

## Authority order

1. Latest explicit user instruction.
2. Accepted ADRs.
3. Approved milestone scope and acceptance criteria.
4. Architecture, product, and security documentation.
5. Chat and informal handoff notes.

If two sources conflict, identify the conflict in the relevant milestone record and seek direction. Do not silently choose a new interpretation.

## Roles and scope

The **Budgeteer — Overseer** task owns the roadmap, cross-milestone decisions, sequencing, and conflict resolution. A milestone task may work autonomously only inside its approved work packet. A subagent may perform a bounded task delegated by its milestone owner, but may not expand scope, make cross-milestone product decisions, or merge work.

Repository documents and commits are canonical memory. Chat is coordination context, not a substitute for updating the repository record.

## Startup protocol

1. Read this file, accepted ADRs, and the relevant milestone file.
2. Inspect Git status before editing.
3. Confirm the work is on the intended milestone branch and identify any existing changes.
4. State assumptions and record material ambiguity as an open question rather than deciding it without authority.

## Work and finish protocol

Use single-writer ownership: one active writer owns each file or tightly coupled file set. Coordinate before overlapping edits. Keep changes limited to the approved packet, verify them, inspect the diff for sensitive content, and commit on the milestone branch only. Do not merge into the default branch.

Before handoff, update the milestone record with branch, stable deliverable commits where useful, changed files, verification, decisions, risks, and the exact next action. Do not record the final commit’s own hash in a tracked file. A milestone task is complete only when its acceptance criteria and handoff are current.

## Approval boundaries

Milestone agents may implement approved acceptance criteria and make reversible local choices consistent with accepted ADRs. They must escalate or document an open question before deciding on a new trust boundary, retention rule, deletion behavior, provider integration, access-control model, canonical financial model, external service, or scope beyond their packet.

## Privacy rules

By default agents and tooling must not open real emails. A future milestone may process a real local email only if its approved work packet explicitly authorizes that data access. Even then, do not copy, commit, include in fixtures, log, paste into chat or documentation, or durably store raw content. Tests and committed fixtures use fully synthetic messages created from scratch only. Do not stage, modify, or quote real email files. Raw email is transient sensitive input: parse it in memory where practical; do not put raw bodies or sensitive headers in logs, errors, analytics, or permanent application storage. If temporary raw storage is unavoidable, it requires encryption, access scoping, a short explicit TTL, and deletion.

The dedicated upstream mailbox remains the raw source and archive initially. The product must not automatically delete provider mail. Any later provider-side deletion option requires separate explicit approval, successful-processing safeguards, and recovery considerations.

Structured records remain sensitive. Store masked account hints only; use managed secrets and encryption for credentials and tokens; commit only fully synthetic fixtures created from scratch.
