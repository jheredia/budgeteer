# M2 independent architecture review

- Date: 2026-10-23.
- Author: internal `m2_proposal` architect; independent reviewer: internal `m2_arch_review`; coordinating reviewer: Cloud Overseer.
- Design: [M2 architecture](m2-architecture.md).
- Reviewed revisions: initial architecture `3a48500`; fixes `beae699`; final unambiguous polling wording checked by Overseer.
- Result: passed architectural review; no remaining blocking P1/P2 design findings. At the time of review, application implementation had not begun. The Overseer subsequently approved the reviewed structure and released common implementation under the user's instruction to start after architectural design/review; no new user approval gate is inferred.

## Review scope

Checked the user's required Node.js/TypeScript/SQLite architecture, maintainable module boundaries, basic authenticated shared workspaces, one shared server/store topology, server authorization, minimal membership lifecycle, immutable evidence, transactional approval, ignored-data discard and pragmatic scaling limits. Accepted generic-workspace and raw-email ADRs remain in force. No real email, private database, deployed auth service or actual library implementation was inspected.

## Findings and disposition

| Finding | Risk in the draft | Resolution | Status |
| --- | --- | --- | --- |
| P2: slow uploads unbounded before parsing | A byte limit and parser deadline alone allow a slow client to hold connections/buffers indefinitely. | Independent header/body-idle/whole-request deadlines, finite per-actor/global upload admission, bounded parser workers, zero waiting queues, abort/cleanup rules and stalled-client tests are specified. | Closed; verified by independent reviewer against `beae699`. |
| P2: browser clearing on revocation had no detection mechanism | Immediate server denial does not notify an idle tab; promising immediate remote browser erasure was inaccurate. | Generic cross-tab invalidation, pageshow/focus/navigation revalidation, no more than 30 seconds between active connected-view checks, hidden/offline concealment, stale-response rejection and explicit limits on previously delivered data. | Closed; independently verified. |
| Overseer: invitation-only enrollment must cover auth endpoints | Hiding signup UI alone would let a caller invoke the maintained library endpoint directly. | Protected invitation enrollment context at the auth-library/API boundary and direct-endpoint bypass tests; actual supported hooks/configuration must pass adoption verification. | Closed in design; independently verified. |

The reviewer accepted module separation, server-derived actors, workspace-scoped queries/FKs/replay checks, membership rechecks inside write transactions, selected-workspace-only deletion, no retained ignored fingerprint/tombstone, and explicit HTTPS/shared-server reachability. No further concrete blocking design issue was found.

## Preconditions and verification limits

- Node.js/TypeScript/SQLite are approved in [ADR 0004](../adr/0004-m2-local-runtime-and-store.md). Fastify, Better Auth/password-first, minimal owner/member rules and detailed auth lifecycle are recommendations now approved by the Overseer for compatibility-proven implementation under the user's required password-or-Google authentication scope.
- Pin and verify actual auth-library/version/SQLite integration, password handling, session revocation/expiry, invitation signup guard, session-token storage and credential-at-rest/key management before adoption. Do not claim maintained-library features by assumption or invent cryptography to patch incompatibility.
- Shared-device operation requires explicitly configured HTTPS proxy/origin/network reachability and protected server-local storage. Local two-browser tests cannot prove remote reachability, certificate trust or secure deployment. No deployment/provider setup is authorized here.
- Provider notification contracts/examples remain forthcoming. Names and synthetic templates alone do not prove actual provider support. Agents still have no permission to open real email.
- The planned browser, tenant-isolation, transaction, privacy, concurrency, retention and failure tests have not run: there is no M2 implementation. A review pass is not a security audit, performance benchmark or production-readiness claim.
- The user will add board items; readiness has not been confirmed. Before coding, complete the requested independent architectural review and explicit Overseer release; those are now recorded in the milestone. No Project mutation or default-branch merge occurred.

## Exact continuation

Present the design and seven revised planning items (architecture checkpoint plus six application items) to the user. With independent review and Overseer release complete, implement the reviewed boundaries and prove library compatibility before relying on it. Obtain actual non-email provider contracts before claiming adapters. Keep the canonical milestone record current and report to the Overseer directly.
