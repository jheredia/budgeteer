# M2 Local import, review, and persistent ledger

- Status: in progress; first shared-account foundation checkpoint implemented and verified; provider, financial-journey and remaining auth/shared-operation gates remain.
- Owner: internal `m2_implementation` agent under the single Cloud Overseer; proposal/architecture and independent review delivered by separate internal agents.
- Branch: `codex/m2-local-app`, based on accepted M1 history at `ba36146`; M1 is unmerged to `master`.
- Dependency: M1 accepted on 2026-10-23.
- Authorization: the user approved Node.js/TypeScript/SQLite, authorized architectural design/review before implementation, and required basic authentication/shared membership. They will add board items; creation is not yet confirmed. The requested architecture gate is complete; the Overseer releases common infrastructure, authentication/shared-workspace and review/ledger implementation under the user's explicit instruction to start. This is an implementation-start exception without claiming board creation. No real-email agent access, production deployment, Project mutation or merge is authorized. Proposal/design branch publication uses the established GitHub synchronization workflow.

## Demonstrable outcome

Two individually authenticated members use one shared workspace, contribute authorized local imports, review proposals/evidence, and see the same persistent ledger/provenance/CLP summaries after restart. A nonmember cannot access any workspace financial resource. Local development tests use isolated browser accounts; actual multi-device use requires the same reachable HTTPS server/store described in the reviewed architecture.

## Scope

Preserve M1's accepted review-first green design, generic workspace language, Spanish (Chile), CLP, `America/Santiago`, responsive layouts, keyboard operation, overview/ledger/provenance/source journeys. Add local import, durable minimized data, authentication and basic shared-workspace membership. Couples and families are core use cases without restricting generic workspace terminology. An actual workspace starts empty: M1 synthetic records never silently become user financial data. Preserve M1 as a separate demo; reload/restart must not erase real workspace data.

Exclude Gmail/mailbox access, provider credentials, synchronization, production hosting, advanced permission granularity beyond basic owner/member access, production insights, semantic duplicate matching/reconciliation, refund handling, card-bill payment handling, transfer matching, and automatic provider-mail deletion. No real, redacted, or synthetic email file may enter Git. Tests construct messages in memory at runtime.

## Overseer-reviewed Project item list

The six application items below are revised after user feedback, with an added architecture checkpoint (item 0). Runtime/store are approved; architecture/library/auth-policy details have passed independent/Overseer design review and require actual compatibility/adoption tests before reliance. This is not confirmation that Project items exist. Estimates are relative points; item 1 expands from M/5 to L/13 for authentication and shared membership.

### 0. Design and review the shared application architecture

- Priority High; Size M; Estimate 3; Dependencies none.
- Outcome: the implementation has a reviewable structure and explicit access/data boundaries before code is written.
- Acceptance: document module dependencies, HTTP/service/repository contracts, authentication/membership, shared-server topology, migrations/transactions, privacy/lifecycle and SQLite scaling limits; complete independent review, address blocking findings, and obtain explicit Overseer release under the user's design-before-implementation instruction.
- Status: [architecture](../design/m2-architecture.md) and [independent review](../design/m2-architecture-review.md) passed independent review and Overseer review. The common implementation phase is now released; no application code existed at this architecture checkpoint.

### 1. Sign in to a persistent shared workspace

- Priority High; Size L; Estimate 13; Depends on item 0 and the architecture release gate.
- Outcome: two independent app accounts can join one workspace and contribute/read the same persistent data after restart, while a third nonmember is denied.
- Acceptance: documented local launch preserves M1's responsive green shell; maintained password or Google authentication (password-first recommended) resolves real server sessions; basic owner/member invitation/removal is server-enforced on every resource, query, import and review mutation. Two isolated browser contexts prove actual sharing, not a cosmetic user switch. The shared HTTPS topology uses one app/store, not per-device private databases. Library/session/secret compatibility must pass its adoption gate. Empty workspace, migrations and store-failure states never silently replace existing data. The host OS account is not an app membership boundary; advanced roles remain M6.

### 2. Import Banco de Chile and Banco Santander notifications

- Priority High; Size L; Estimate 13; Depends on item 1 and approved matrix contracts for these providers.
- Outcome: the user selects a local notification from either provider and receives a reviewable proposal/evidence or an honest unsupported/invalid result.
- Acceptance: implement the common single-file import pipeline plus deterministic adapters for the approved Debit, Received Payment, Credit Card Purchase, and Bank Transfer families offered by these providers. Each applicable matrix cell has approved non-email recognition/field rules and in-memory synthetic cases; none is called supported from its name alone. Propose one `.eml` per action, 1 MiB limit and a five-second parse deadline, all approval-pending. Reject unsupported, ambiguous, oversized, timed-out, or malformed input without guessed amount/date/currency. Parse in memory; do not render remote/active HTML or process attachments. Never retain raw bytes, bodies, sensitive headers, or original filenames. A successful import atomically saves allowed structured fields and an opaque exact-input fingerprint; rejected imports retain no input/proposal. Identical-byte reimport reports an existing retained pending/approved result across restart, scoped to the authorized workspace. Ignored inputs leave no replay marker; reimport may create a new proposal. Safe diagnostics contain codes/identifiers, not payloads.

### 3. Import Banco Estado and MercadoPago notifications

- Priority High; Size L; Estimate 8; Depends on item 2 and approved matrix contracts for these providers.
- Outcome: the same local import/review journey accepts the other two requested providers without a separate UI or data model.
- Acceptance: extend the shared pipeline with deterministic adapters for the approved Debit, Received Payment, Credit Card Purchase, and Bank Transfer families offered by Banco Estado and MercadoPago. Apply the identical recognition, uncertainty, in-memory parsing, minimization, replay and rejection rules from item 2. Clearly disclose unsupported/not-applicable variants; unresolved cells block claiming their support and cannot be silently removed from requested scope. Tests cover every approved applicable cell, including rejected/ambiguous cases, without email files.

### 4. Review and decide an imported transaction

- Priority High; Size L; Estimate 8; Depends on item 2.
- Outcome: the user inspects uncertainty and evidence, confirms or corrects the proposed record, and approves or ignores deliberately.
- Acceptance: distinguish proposed values from supporting evidence; unavailable fields stay explicit. Allow correction of merchant/counterparty label, amount, date, category, type and direction before approval, validating required fields and positive integer CLP amounts. For direction, offer confirmed incoming/outgoing or explicitly unresolved rather than guessing a financial meaning. Approval creates exactly one canonical record and evidence reference, removing pending state in one durable transaction; repeated clicks/retries cannot approve twice. Ignore creates no canonical entry and removes the proposal, unreferenced evidence and replay fingerprint/tombstone immediately. Reimporting ignored bytes may therefore create a fresh proposal. Authorization is rechecked within the approval/ignore transaction, including member-removal races. A failure/restart cannot leave a half-approved record. Evidence is never silently rewritten to match a review decision.

### 5. Explore the saved ledger and notification summaries

- Priority High; Size M; Estimate 5; Depends on item 4.
- Outcome: the user finds saved records, checks provenance, and understands monthly notification amounts without mistaking them for reconciled finances.
- Acceptance: combine/clear month, provider, type and direction filters; meaningful empty states and visible totals match the exact filtered canonical records. Pending/ignored proposals never count. Every entry opens distinct record/evidence detail. Summaries separate confirmed incoming, confirmed outgoing, credit-card-purchase amounts, and unresolved-direction records; credit-card purchases are not presented as bank-account cash outflows, incoming payments are not automatically income, and bank transfers are not automatically expenses. Any cross-period comparison keeps the same disclosed type/direction basis and handles zero denominators and Santiago month boundaries. Approval updates all views; totals/provenance survive restart. Explain that these are unmatched notification records: no cash balance, income calculation, transfer reconciliation, or cross-message semantic deduplication is claimed.

### 6. Understand local sources and control saved data

- Priority Medium; Size M; Estimate 3; Depends on items 2 and 3.
- Outcome: the user understands provider coverage, retained local data, and deliberate local data removal.
- Acceptance: source status says manual local import with no mailbox connection/sync; show actual supported provider/type families and safe unsupported outcomes without retaining original filenames. Explain raw-input minimization, no permanent raw-email archive, and no provider deletion. Disclose pending-record expiry and implement the approved financial retention policy plus reviewed owner-only workspace deletion with recent authentication/confirmation; closing/refreshing/restarting or a demo reset must not delete saved records. Delete only the selected workspace data/memberships/invitations: never unlink the entire application database or delete unrelated users/workspaces. State that deletion leaves original files/provider mail untouched and does not promise secure erasure from OS/backups.

Dependencies are acyclic: 0 → 1 → 2; 2 → 3 and 4; 4 → 5; 2+3 → 6. Review does not wait for the second provider group; the final milestone acceptance pass integrates all six items. Shared persistence/state contracts belong to item 1; item 2 owns the common import pipeline and first provider pair, item 3 owns the other pair, item 4 owns review decisions, item 5 owns read views, and item 6 owns coverage/data disclosure and deletion. End-to-end setup/restart/recovery, responsive, keyboard, and privacy verification belong to the milestone Definition of Done below, not a verification-only Project item.

All sizes/estimates are provisional: actual provider formats and the number of applicable variants are unknown. Revise the estimate with the user if approved contracts require substantially different work; do not claim that sixteen variants are already known or supported.

- Overseer decision: revised application scope plus architecture checkpoint ready for manual planning. Architectural structure passed independent review; independent/Overseer review is complete; library adoption checks and provider contracts gate their respective work. User Project setup remains unconfirmed; the user's explicit start instruction releases common implementation after the architecture gate without claiming setup occurred.
- User Project setup: pending; all creation/status changes remain manual.

## Decision status and architecture gate

Node.js/TypeScript/SQLite are approved (ADR 0004). Basic authentication and shared membership are required now. The user accepted financial retention with the correction that ignored data is discarded entirely. The architecture has passed independent review; the Overseer approves the documented password-first and minimal owner/member design within the requested scope, subject to actual library compatibility and credential-protection proof. See [design](../design/m2-architecture.md) and [review](../design/m2-architecture-review.md).

### Runtime, access model and operating boundary

Use approved Node.js/TypeScript and SQLite. The reviewed design recommends a modular monolith, Fastify transport, a maintained MIME parser, feature-oriented browser modules, typed application services and workspace-scoped repository adapters. Fastify and Better Auth password-first are reviewed library candidates released for compatibility-proven adoption, not yet installed dependencies. Google OIDC is an identity-only alternative/extension, not a requirement to implement both or request Gmail scopes. No production hosting provider is selected.

The prior one-OS-user/no-auth product model is superseded. One host OS account operates the app; individually authenticated application accounts share workspace rows via basic membership policies. Default local development stays loopback-only. Real members on separate devices access one explicitly configured HTTPS reverse proxy/app/database, with Host/Origin/CSRF/cookie/proxy-trust controls. This design does not automatically open a LAN port, configure a proxy or provision production hosting.

SQLite lives outside the repository on protected server-local storage. The user accepted reliance on OS access/device encryption for financial data rather than adding application-level database encryption now. Authentication creates a separate credential/session protection obligation: password hashes, keys, token storage, library compatibility and an appropriate encrypted store/volume must be verified under the architecture adoption gate; do not assume tokens are hashed or encryption is already configured. No auth credential or token may be printed or committed.

### Requested provider/type matrix: format contracts unresolved

The user explicitly requested Banco de Chile, Banco Santander, Banco Estado and MercadoPago, with Debit, Received Payment, Credit Card Purchase and Bank Transfer notifications. All four providers and all four types are in the requested M2 scope. The matrix records coverage obligations, not evidence that every provider issues every type in an already-known format.

| Provider | Debit | Received Payment | Credit Card Purchase | Bank Transfer |
| --- | --- | --- | --- | --- |
| Banco de Chile | Contract pending | Contract pending | Contract pending | Contract pending |
| Banco Santander | Contract pending | Contract pending | Contract pending | Contract pending |
| Banco Estado | Contract pending | Contract pending | Contract pending | Contract pending |
| MercadoPago | Contract pending | Contract pending | Contract pending | Contract pending |

Before implementing or claiming an adapter for a cell, resolve it to an approved supported notification-family contract or a user-approved not-applicable/unsupported status. Infrastructure and common review work can be released separately once their packet decisions are approved; unresolved cells still block complete M2 acceptance. A provider-specific family can have several versions, and names alone do not establish sixteen actual formats. Do not invent a bank format or silently narrow to one provider/type to fit an estimate. Obtain a non-email structured description of recognition labels, field meanings and date/amount conventions, or suitable public documentation. No raw or redacted message is requested or authorized for agent inspection. If a contract cannot be established, escalate the specific coverage gap before claiming real-world support. Construct test MIME in memory from approved contracts. Sender strings do not establish authenticity; do not invoke an LLM on raw messages or guess missing amount/date/currency.

Proposed interpretation, requiring user approval: Debit means an account-debit notification whose cause is not automatically an expense; Received Payment means a received-payment notification whose receipt is not automatically income; Credit Card Purchase means a purchase notification whose amount is separate from bank-account cash flow; Bank Transfer means a transfer notification with incoming/outgoing/unresolved direction, without automatically classifying its economic purpose or matching another record. Keep the positive CLP amount, requested notification type and confirmed/unknown direction separate; unknown direction is excluded from directional totals and visibly counted as unresolved. Categories are user-reviewed suggestions, not automated financial classification. Exact labels/mappings belong to the approved local data contract; M4 still owns semantic duplicate, transfer matching and advanced financial treatment.

Propose CLP-only import initially; another currency reports unsupported rather than inventing conversion. The packet must explicitly authorize the user's later deliberate local import of a selected real file for these approved families. That does not authorize this agent, the Overseer or cloud tools to open real mail or inspect a private database. Acceptance evidence stays synthetic unless separate narrow data-access authorization is supplied.

### Minimized state, retention, and deletion

Proposed persisted classes: (a) pending proposal fields needed for review; (b) canonical notification-record fields needed by ledger/summaries, including requested type and confirmed/unresolved direction; (c) separately referenced minimized evidence such as recognized source family, extraction version, observed amount/date/merchant and masked account hint; (d) opaque exact-input fingerprint plus its processing state; (e) safe migration/operational identifiers. Exclude bodies, raw MIME, sensitive headers, full account identifiers, attachments, original filenames and arbitrary parser payloads. Concrete allowlisted fields, type/length bounds and the review lifecycle require approved schema/ADR records before implementation. Minimized fields cannot become an arbitrary payload bucket.

Approved financial retention direction: pending proposal/evidence expiration after 30 days; ignored proposals immediately drop all proposal/evidence/replay-marker data with no tombstone. Approved ledger/supporting evidence and its replay fingerprint remain for the user's workspace lifetime until explicit local-workspace deletion. This is an explicit user-controlled, potentially unbounded retention choice, not an implied privacy guarantee. New auth/session/invitation retention remains specified separately in the architecture review. Check expiry on startup/import with deterministic tests. Unsupported/rejected raw inputs have zero durable retention. No temporary raw store is proposed.

Workspace deletion is owner-only, reauthenticated and confirmed, removing only the selected workspace's financial records, evidence, replay markers, invitations and memberships transactionally. It does not unlink the application DB or remove other workspaces/global accounts. The reviewed architecture defines the required policy, browser isolation and lifecycle tests. Secure physical erasure and OS/cloud backups are outside the app's guarantees. Original files/provider mail are untouched.

Exact-input replay protection is not anonymization: fingerprints are sensitive derived data. It covers identical bytes only while pending/approved records remain; changed-byte equivalent notifications remain M4 work. After ignore, expiry or authorized deletion, identical bytes may be imported again. No ignored replay marker is kept merely to prevent that.

## Acceptance criteria

- [x] User approved Node.js/TypeScript/SQLite; accepted ADR 0004 records the scope.
- [x] Architectural design and independent review completed; blocking review findings addressed.
- [x] Independent/Overseer architecture review and explicit common application implementation release under the user's instruction to start.
- [ ] Two independently authenticated members contribute/read shared records; nonmembers are denied across all APIs and repository paths.
- [ ] Reviewed trust, auth/session, schema, membership and lifecycle controls pass actual pinned-library and isolation tests.
- [ ] Requested provider/type matrix and deterministic recognition contracts are resolved without agent email access; unsupported/not-applicable gaps require explicit user agreement.
- [ ] User-only local real-input authorization is explicit before real local import is enabled; tests remain synthetic.
- [ ] One locally runnable flow imports, reviews, approves/ignores and displays the persistent ledger/totals/provenance.
- [ ] Restart preserves correct state; failures do not create partial/double canonical records or silently reset data. Runtime-generated synthetic MIME verifies all approved applicable matrix cells, approve/ignore/reimport/restart, unsupported/oversized/ambiguous inputs, safe diagnostics, and no raw payloads in store/logs. Simulated failed writes and an interrupted review preserve existing canonical records. No backup/restore or production operations system is implied.
- [ ] Mobile/desktop/keyboard behavior preserves M1's accepted direction and uncertainty/provenance distinctions.
- [ ] No raw payload retention/logging, email-file fixture, mailbox connectivity or excluded production feature is introduced.
- [ ] Launch, test evidence, limitations, and exact continuation are reviewable.

## Verification

The architecture checkpoint was documentation-only. Application foundation now exists in `app/`; the accepted M1 prototype remains unchanged. Stage evidence below records actual TypeScript, HTTP and Chromium checks. No provider parser, financial-ledger persistence or real-input support is verified. No real email or ignored input path was opened.

## Risks and open questions

- The four providers/types are now specified, but their non-email format contracts remain missing. Coverage cannot be claimed from provider names or invented synthetic examples.
- Financial-data OS/disk-protection direction is accepted; auth/session token storage and key-management compatibility remain an explicit adoption gate before shared real-data operation.
- Basic auth/shared membership are user-required M2 scope; exact library/owner-member policy/session lifecycle, workspace-scoped deletion and domain schema require the architecture gate, not inheritance from M1 demo behavior.
- M1 is accepted and published on its branch but unmerged; this branch is based on its acceptance history. Do not merge to `master` or rewrite history without authorization.
- Multi-user isolation is mandatory in M2 and must be tested, not inferred from login or loopback binding. M6 extends permissions/lifecycle; it no longer introduces sharing for the first time.

## Current state and handoff

- Branch/base: `codex/m2-local-app` from `ba36146` in the dedicated `/workspace/budgeteer-m2-proposal` worktree.
- Project items: six revised application items plus architecture item 0; user says they will add items, creation remains unconfirmed. Independent/Overseer architecture review is complete and common implementation is released; provider/adoption gates remain.
- Changed files: milestone/governance/product/security/architecture records and accepted runtime ADR, architecture design and independent review; no application files changed.
- Verification: proposal/document checks only; no implementation or sensitive-data access.
- Exact next action: publish the independently reviewed architecture and corrected M2 item list, and implement the common app under the completed architecture gate. Record board readiness when confirmed; verify auth-library behavior before adoption and provider contracts before claiming each adapter. No raw email access is authorized for agents. User acceptance of the runtime and instruction to start architecture work do not skip architectural review.

## Change log

| Date | Change | Owner |
| --- | --- | --- |
| 2026-10-23 | Prepared six-item local-app proposal covering four requested providers/types, explicit matrix/semantic/data-policy decision gates and end-to-end restart acceptance; no implementation authorized. | M2 proposal agent |
| 2026-10-23 | Overseer completed contention: removed unnecessary second-provider dependency from review, required validated corrections with preserved evidence, and staged contract approval by adapter while preserving all requested coverage obligations. | Cloud Overseer |
| 2026-10-23 | User approved runtime/store, required reviewed architecture and basic authentication/shared membership in M2, and rejected retained ignored data. Added architecture checkpoint, revised item 1, and reconciled M6 scope. | Cloud Overseer |


## Staged continuation — 2026-10-24

The worktree resumed clean at `31c32bd`. The initial implementation attempt stopped at a usage limit before application code was written. Common work has resumed with maintained-auth/SQLite compatibility and shared-workspace persistence. See [development workflow](../development-workflow.md) for one PR per milestone, temporary dependency stacking and stage checkpoints. Provider gates and final acceptance remain unchanged. No completed M2 feature is asserted by this continuation record.


## First foundation checkpoint — 2026-10-24

- Stable app deliverable: `47d0cb2259bf825b595f94556428a344a51cc3d9`; implementation and [launch instructions](../../app/README.md) in `app/`. Stage 1 is a partial milestone checkpoint, not completion of item 1 or all M2.
- Maintained library proof uses pinned Better Auth/Fastify/SQLite with protected enrollment context and HTTP endpoint allowlisting. Library signup enumeration protection can return synthetic 200 without creating an account; raw public signup is denied by the application. Browser JSON omits session tokens. The real SQLite library stores usable bearer tokens: encrypted storage remains a real shared-operation gate, not an invented hash/encryption claim.
- The author and Overseer ran checks: TypeScript and six Node test cases passed, plus a real listening-server/Chromium proof with independent owner/member/outsider contexts. Proof covers invitation-only enrollment, shared membership, nonmember/owner boundaries, restart, removal, logout, preserved active forms and discarded late invitation responses after identity invalidation. Safe screenshots and machine-readable evidence are in `app/verification/`. Synthetic identities/keys were generated at runtime; temporary test databases were cleaned and no proof server remains running.
- Corrected review findings include invalid bootstrap orphaning, interrupted setup recovery, unsupported-schema protection, strict local-date validation, transport token exposure, stale client action results and visible-form polling resets. No full security/accessibility/production readiness claim is made.
- Remaining: persisted financial proposals/evidence/review/ledger; all provider adapters/contracts; complete auth rate/expiry/password-change/account/cleanup checks and shared HTTPS/proxy/storage verification. Item 1 remains in progress. No real financial data should be used in this checkpoint's shared-operation mode.
- Review workflow: M1 PR #1 targets `master`; M2 draft PR #2 targets M1. Neither PR has been merged; `master` is unchanged. Project statuses remain manual. Next bounded work is common financial services/read journeys and remaining auth adoption checks while actual provider formats remain gated.
