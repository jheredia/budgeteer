# M2 Local import, review, and persistent ledger

- Status: Overseer contention complete; reviewed proposal ready for user decisions and manual Project setup; implementation unauthorized.
- Owner: internal `m2_proposal` agent under the single Cloud Overseer.
- Branch: `codex/m2-local-app`, based on accepted M1 history at `ba36146`; M1 is unmerged to `master`.
- Dependency: M1 accepted on 2026-10-23.
- Authorization: proposal preparation only. No implementation, real-email access, production-stack selection, Project mutation, or merge is authorized. The Overseer may publish this proposal branch under the user-authorized GitHub branch synchronization workflow; publication does not authorize implementation.

## Demonstrable outcome

A user runs Budgeteer locally, deliberately imports one authorized notification from a supported real-world input family, reviews its minimized proposal/evidence, approves or ignores it, and reopens the app to find the correct persistent ledger, provenance, and CLP totals.

## Scope

Preserve M1's accepted review-first green design, generic workspace language, Spanish (Chile), CLP, `America/Santiago`, responsive layouts, keyboard operation, overview/ledger/provenance/source journeys. Add local import and durable minimized data. An actual workspace starts empty: M1 synthetic records never silently become user financial data. Preserve M1 as a separate demo; reload/restart must not erase real workspace data.

Exclude Gmail/mailbox access, provider credentials, synchronization, production hosting, multi-member authorization, production insights, semantic duplicate matching/reconciliation, refund handling, card-bill payment handling, transfer matching, and automatic provider-mail deletion. No real, redacted, or synthetic email file may enter Git. Tests construct messages in memory at runtime.

## Overseer-reviewed Project item list

The six-item decomposition below passed Overseer contention. These are planning items for manual creation, not confirmation that Project items exist or that technical/data decisions are approved. Estimates are relative points.

### 1. Open a persistent local workspace

- Priority High; Size M; Estimate 5; Dependencies none.
- Outcome: a user can install/start the app, open an empty workspace, stop it, and reopen the same workspace without mixing demo data.
- Acceptance: one documented local launch path serves the accepted responsive shell; the empty workspace is usable; the chosen minimized store and migrations initialize/reopen safely; a store failure is visible without replacing existing data with an empty/demo store. The approved local trust boundary and minimized storage schema below are implemented, not inferred; item 6 owns retention/deletion controls. Local request protections do not introduce user accounts.

### 2. Import Banco de Chile and Banco Santander notifications

- Priority High; Size L; Estimate 13; Depends on item 1 and approved matrix contracts for these providers.
- Outcome: the user selects a local notification from either provider and receives a reviewable proposal/evidence or an honest unsupported/invalid result.
- Acceptance: implement the common single-file import pipeline plus deterministic adapters for the approved Debit, Received Payment, Credit Card Purchase, and Bank Transfer families offered by these providers. Each applicable matrix cell has approved non-email recognition/field rules and in-memory synthetic cases; none is called supported from its name alone. Propose one `.eml` per action, 1 MiB limit and a five-second parse deadline, all approval-pending. Reject unsupported, ambiguous, oversized, timed-out, or malformed input without guessed amount/date/currency. Parse in memory; do not render remote/active HTML or process attachments. Never retain raw bytes, bodies, sensitive headers, or original filenames. A successful import atomically saves allowed structured fields and an opaque exact-input fingerprint; rejected imports retain no input/proposal. Identical-byte reimport reports the existing pending/approved/ignored result across restart. Safe diagnostics contain codes/identifiers, not payloads.

### 3. Import Banco Estado and MercadoPago notifications

- Priority High; Size L; Estimate 8; Depends on item 2 and approved matrix contracts for these providers.
- Outcome: the same local import/review journey accepts the other two requested providers without a separate UI or data model.
- Acceptance: extend the shared pipeline with deterministic adapters for the approved Debit, Received Payment, Credit Card Purchase, and Bank Transfer families offered by Banco Estado and MercadoPago. Apply the identical recognition, uncertainty, in-memory parsing, minimization, replay and rejection rules from item 2. Clearly disclose unsupported/not-applicable variants; unresolved cells block claiming their support and cannot be silently removed from requested scope. Tests cover every approved applicable cell, including rejected/ambiguous cases, without email files.

### 4. Review and decide an imported transaction

- Priority High; Size L; Estimate 8; Depends on item 2.
- Outcome: the user inspects uncertainty and evidence, confirms or corrects the proposed record, and approves or ignores deliberately.
- Acceptance: distinguish proposed values from supporting evidence; unavailable fields stay explicit. Allow correction of merchant/counterparty label, amount, date, category, type and direction before approval, validating required fields and positive integer CLP amounts. For direction, offer confirmed incoming/outgoing or explicitly unresolved rather than guessing a financial meaning. Approval creates exactly one canonical record and evidence reference, removing pending state in one durable transaction; repeated clicks/retries cannot approve twice. Ignore creates no canonical entry and removes minimized proposal/evidence according to the approved policy, retaining only the bounded replay marker. A failure/restart cannot leave a half-approved record. Evidence is never silently rewritten to match a review decision.

### 5. Explore the saved ledger and notification summaries

- Priority High; Size M; Estimate 5; Depends on item 4.
- Outcome: the user finds saved records, checks provenance, and understands monthly notification amounts without mistaking them for reconciled finances.
- Acceptance: combine/clear month, provider, type and direction filters; meaningful empty states and visible totals match the exact filtered canonical records. Pending/ignored proposals never count. Every entry opens distinct record/evidence detail. Summaries separate confirmed incoming, confirmed outgoing, credit-card-purchase amounts, and unresolved-direction records; credit-card purchases are not presented as bank-account cash outflows, incoming payments are not automatically income, and bank transfers are not automatically expenses. Any cross-period comparison keeps the same disclosed type/direction basis and handles zero denominators and Santiago month boundaries. Approval updates all views; totals/provenance survive restart. Explain that these are unmatched notification records: no cash balance, income calculation, transfer reconciliation, or cross-message semantic deduplication is claimed.

### 6. Understand local sources and control saved data

- Priority Medium; Size M; Estimate 3; Depends on items 2 and 3.
- Outcome: the user understands provider coverage, retained local data, and deliberate local data removal.
- Acceptance: source status says manual local import with no mailbox connection/sync; show actual supported provider/type families and safe unsupported outcomes without retaining original filenames. Explain raw-input minimization, no permanent raw-email archive, and no provider deletion. Disclose pending-record expiry and implement the explicitly approved retention/deletion policy with confirmation before deleting the local workspace; closing/refreshing/restarting or a demo reset must not delete saved records. State that local deletion leaves the original file/provider mail untouched and does not promise secure erasure from OS/backups.

Dependencies are acyclic: 1 → 2; 2 → 3 and 4; 4 → 5; 2+3 → 6. Review does not wait for the second provider group; the final milestone acceptance pass integrates all six items. Shared persistence/state contracts belong to item 1; item 2 owns the common import pipeline and first provider pair, item 3 owns the other pair, item 4 owns review decisions, item 5 owns read views, and item 6 owns coverage/data disclosure and deletion. End-to-end setup/restart/recovery, responsive, keyboard, and privacy verification belong to the milestone Definition of Done below, not a verification-only Project item.

All sizes/estimates are provisional: actual provider formats and the number of applicable variants are unknown. Revise the estimate with the user if approved contracts require substantially different work; do not claim that sixteen variants are already known or supported.

- Overseer decision: item scope/decomposition reviewed and amended; ready for manual planning. Technical/data decisions below and user Project setup remain pending; implementation is not released.
- User Project setup: pending; all creation/status changes remain manual.

## Proposed decisions requiring approval

All recommendations below are proposals, not accepted architecture, retention, trust, or domain decisions.

### Local runtime and store

Recommend a local Node.js/TypeScript HTTP app with SQLite and a maintained MIME parser, reusing the M1 frontend design. A single-process local store keeps setup lighter than provisioning Postgres and makes transaction boundaries/restart tests practical. Pin a supported runtime and dependencies during implementation; the exact libraries and file layout must be recorded with the approved packet. Python plus SQLite is a credible alternative but would add a second frontend/backend language; a remote database or Vercel deployment would introduce unnecessary M2 scope. This recommendation does not select the production runtime/database/platform.

Propose same-machine, one-OS-user use: loopback binding only, explicit local Host/Origin validation and same-origin mutation protections; no account/authentication flow, remote listening, or credentials. Reject network exposure rather than suggesting this is safe for LAN/shared hosting. Agents must not inspect unrelated local data.

Recommend the database live in an OS user-data directory outside the repository, restricted to that OS user, with no raw upload staging directory. SQLite contents would not receive application-level encryption in this bounded recommendation: require the user to accept reliance on OS account protections and device full-disk encryption for real financial use, or choose application encryption/key management before implementation. File permissions are not a substitute for encryption. No claim that this posture is already approved or that disk encryption has been verified on the user's device.

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

Propose pending proposal/evidence expiration after 30 days; ignored proposals immediately drop their financial fields/evidence and retain only a replay fingerprint for 30 days. Approved ledger/supporting evidence and its replay fingerprint remain for the user's workspace lifetime until explicit local-workspace deletion. That is an explicit user-controlled, potentially unbounded retention choice requiring approval, not a hidden default. Check expiry on startup/import with deterministic tests. Unsupported/rejected raw inputs have zero durable retention. No temporary raw store is proposed.

Workspace deletion deliberately removes the app-owned local database and its SQLite sidecars, with confirmation and no automatic backup feature. Explain that secure physical erasure and OS/cloud backups are outside the app's guarantees. The user's original selected file and provider mailbox are untouched. Exact-input replay protection is not anonymization: fingerprints remain sensitive derived data. It prevents identical-byte reimports only; changed-byte equivalent notifications and advanced duplicate handling remain M4. If a replay marker expires or the workspace is deleted, identical input can be imported again.

## Acceptance criteria

- [ ] Approved local runtime/store, trust boundary, schema/state lifecycle and retention/deletion decisions are recorded.
- [ ] Requested provider/type matrix and deterministic recognition contracts are resolved without agent email access; unsupported/not-applicable gaps require explicit user agreement.
- [ ] User-only local real-input authorization is explicit before real local import is enabled; tests remain synthetic.
- [ ] One locally runnable flow imports, reviews, approves/ignores and displays the persistent ledger/totals/provenance.
- [ ] Restart preserves correct state; failures do not create partial/double canonical records or silently reset data. Runtime-generated synthetic MIME verifies all approved applicable matrix cells, approve/ignore/reimport/restart, unsupported/oversized/ambiguous inputs, safe diagnostics, and no raw payloads in store/logs. Simulated failed writes and an interrupted review preserve existing canonical records. No backup/restore or production operations system is implied.
- [ ] Mobile/desktop/keyboard behavior preserves M1's accepted direction and uncertainty/provenance distinctions.
- [ ] No raw payload retention/logging, email-file fixture, mailbox connectivity or excluded production feature is introduced.
- [ ] Launch, test evidence, limitations, and exact continuation are reviewable.

## Verification

Proposal only. Repository status and canonical documents reviewed; no app code, parser, schema, database or real-input verification exists. Whitespace checks passed and only this milestone document changed. No local Markdown links were introduced. No real email or ignored path was opened.

## Risks and open questions

- The four providers/types are now specified, but their non-email format contracts remain missing. Coverage cannot be claimed from provider names or invented synthetic examples.
- Local unencrypted structured storage with OS/disk protections versus app-managed encryption must be decided explicitly before real-data enablement.
- Runtime/store, retention periods, destructive local deletion and review schema are proposed decisions, not pre-approved M1 behavior.
- M1 is accepted and published on its branch but unmerged; this branch is based on its acceptance history. Do not merge to `master` or rewrite history without authorization.
- Request protections reduce drive-by local API exposure but do not establish multi-user security. M6 permissions remain future work.

## Current state and handoff

- Branch/base: `codex/m2-local-app` from `ba36146` in the dedicated `/workspace/budgeteer-m2-proposal` worktree.
- Project items: six Overseer-reviewed planning items above; user creation remains unconfirmed. Technical/data decisions and implementation release remain pending.
- Changed files: only this document.
- Verification: proposal/document checks only; no implementation or sensitive-data access.
- Exact next action: present the six reviewed planning items and proposed local runtime/data choices to the user for approval and manual Project creation. Resolve the provider/type contracts without agent access to real email; approve common infrastructure and each adapter at their relevant gates. Implementation starts only after the applicable approval/setup/release gates. Do not infer release from M1 acceptance or proposal publication.

## Change log

| Date | Change | Owner |
| --- | --- | --- |
| 2026-10-23 | Prepared six-item local-app proposal covering four requested providers/types, explicit matrix/semantic/data-policy decision gates and end-to-end restart acceptance; no implementation authorized. | M2 proposal agent |
| 2026-10-23 | Overseer completed contention: removed unnecessary second-provider dependency from review, required validated corrections with preserved evidence, and staged contract approval by adapter while preserving all requested coverage obligations. | Cloud Overseer |
