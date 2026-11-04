# Budgeteer M2 — synthetic local import, review and ledger

This checkpoint provides a runnable **synthetic local verification** flow: authenticated workspace members import one invented MIME message or use the built-in example, correct/approve or ignore a proposal, and read the persistent ledger and unchanged minimized evidence after restart. Workspaces start empty. This is not ready for real emails, real financial values or shared real-data operation. The accepted M1 prototype remains in `../prototype/`.

The five released text contracts remain intact. MIME is decoded transiently by pinned MailParser 3.14.2 and HTML is structurally parsed by parse5 8.0.0 in terminable workers; no HTML is rendered and no resources are fetched. The upload accepts `application/octet-stream`, without filenames, only after authentication/workspace authorization, same-origin validation and an explicit synthetic-only declaration. Built-in examples construct MIME in memory; no email fixtures are stored.

## Run locally

Requires Node.js 24 and npm. From this directory:

```sh
npm ci
npm run configure
npm run setup
npm run dev
```

Open `http://127.0.0.1:4174/`. `configure` creates a random auth key outside the repository with restricted permissions, without printing its value; it never replaces an existing key. `setup` asks for the first account and workspace, reads the password without echo, and closes bootstrap once an owner exists. There are no default credentials, public signup or bootstrap HTTP endpoints. Passwords are never command-line arguments. In an automated environment, inject `BETTER_AUTH_SECRET` through protected runtime configuration instead of `configure`.

Data defaults to `~/.local/share/budgeteer/`. Set `BUDGETEER_DATA_DIRECTORY` to another protected directory outside this repository if necessary. A database or key in the repository is rejected. File permissions do not provide encryption. Do not commit/copy the database, key or SQLite sidecars. No synthetic financial records are inserted into a normal workspace.

The owner creates a one-use, 24-hour invitation link and delivers it directly to the intended collaborator. New collaborators enroll through that invitation; existing accounts sign in and accept it. Each browser uses an individual account against the same application/database. A member cannot invite/remove others. Removing membership denies the next protected request. Imported financial data belongs to the workspace and remains workspace-owned when a contributor is removed.

If bootstrap is interrupted after credential creation but before workspace creation, run setup again with the same account and correct password. The maintained auth library verifies the password before workspace recovery; it does not reset or reveal it. Invalid workspace input is validated before account creation.

## Maintained library adoption evidence

Pinned actual packages: Better Auth 1.7.12, Fastify 5.12.7, better-sqlite3 12.11.1, patched @fastify/static 10.1.10; lockfile is committed. Node typings target Node 24.

- The library user-create hook requires private server enrollment context; no request flag/header can supply it. Public auth routes allow only sign-in/sign-out. Raw signup is blocked before the library; the library hook separately prevents account creation. Better Auth deliberately returns a synthetic HTTP 200 when a forbidden create hook runs under enumeration protection; this is not a created account.
- Password hashing/session creation/revocation remain library-owned. Session cache is disabled, seven-day session expiry does not roll forward, and app requests add a 24-hour idle check. Safe app session DTOs contain user display fields only. Sign-in JSON deliberately strips the library's usable bearer token; the browser uses HttpOnly cookies.
- Better Auth's SQLite session rows contain usable bearer tokens, not token hashes. Keys are stored separately from the DB. Shared real-data operation requires the reviewed encrypted-storage/secret-management gate; this checkpoint does not invent token encryption or claim the database is encrypted.
- The initial older static-plugin candidate was rejected by dependency audit; the installed patched version had zero reported production advisories at checkpoint verification.

## Structure

`server/http` owns transport validation and safe error mapping; `server/auth` adapts the maintained library; `server/application` owns account ports and workspace use cases; `server/domain` contains framework-free types/validators; `server/persistence/sqlite` implements scoped repositories and migrations. `client/features` contains typed API/view boundaries. No SQL or credential handling lives in browser modules. Migrations refuse an unsupported application schema before auth migration can mutate it; startup never silently replaces a failed store.

Workspace/member/invitation queries are scoped. Owner/member policy is enforced server-side, not by hidden buttons. Invitations persist only as digests. Signup requires an unexpired invitation and account creation cannot grant financial access by itself. If enrollment loses a race with invitation revocation after account creation, the account may exist without membership; it has no workspace access and can accept a fresh invitation after signing in. Automated orphan account deletion is not implemented.

Financial browser state stays in memory; no financial caches or script-accessible bearer credentials are stored in web storage. Authentication uses the HttpOnly session cookie described above. Revalidation does not rebuild unchanged forms. Logout/context changes invalidate pending responses; a late invitation response cannot render an old workspace grant after cross-tab logout. Visible connected pages revalidate within 30 seconds and on focus/restoration; hidden views clear private content. Server denial is immediate; previously delivered offline data cannot be recalled.

## Verification

```sh
npm run build
npm test
npm run test:browser
npm run test:financial-browser
```

Browser proof requires Chromium (default `/usr/bin/chromium`, override `BUDGETEER_CHROMIUM`). The app/browser test opens port 4174 and must not collide with a running dev app. It creates runtime-generated synthetic credentials and a temporary DB under the OS temp directory, and removes them after the run. It never writes passwords/cookies/invitation secrets into logs or screenshots. Browser proof records are in `verification/`.

Checks cover raw signup guards, salted password storage, safe session DTOs, cookies/logout revocation, invitation one-use/member/owner boundaries, foreign-origin denial, two isolated browser accounts sharing persisted membership, third-account denial, removal, restart, unchanged-form preservation, delayed invitation response after cross-tab logout, bootstrap recovery, unsupported schema refusal, strict calendar dates and Santiago month boundaries. Actual listening-server/Chromium tests passed; HTTP route tests additionally use Fastify injection. This is not a complete security or accessibility audit.

The added synthetic suite verifies all five runtime MIME examples, base64/quoted-printable decoding, structural HTML/table conflicts and alternatives, malformed/oversize/attachment rejection, worker timeout/cancellation/admission, HTTP/service replay/review/ignore/restart/isolation, bounded aggregate pagination, rollback, expiry including a target beyond the 100-row sweep, populated v1 migration and failed-migration recovery. Real socket checks verify denied unread bodies, actor saturation/disconnect reuse, trickled header/body deadlines and delayed-auth total lifetime. The separate financial Chromium proof covers two accounts, correction vs immutable evidence, ignore/reimport, filters, restart, mobile fit, form preservation and late financial/approval/signout responses. Evidence is in `verification/financial-stage.json` and `verification/financial-member-mobile.png`.

## Financial boundary and lifecycle

The five declared contracts are Banco de Chile account/credit purchases, Santander debit/credit purchases and Santander sent transfers. Selection makes no claim about sender authenticity. Only exact released narratives and headings are supported. Purchase HTML may contain matching known field pairs (`Comercio`/`Destino`, `Monto`, transaction `Fecha`, observed `Hora`, and masked `Origen`/`Cuenta`/`Tarjeta`/`Card` where applicable). Santander may show the matching four visible suffix digits. Unknown fields, due-date tables, hidden blocks, conflicting alternatives, duplicate narratives, conflicting field values and unfamiliar presentations fail safely. Transfer identity/account sections remain unsupported and are never retained. This is bounded contract coverage, not a general bank-email parser.

This stage approves **calendar dates only** (`DATE_ONLY_REQUIRED` for offset timestamps). Evidence keeps an observed local purchase time with timezone unknown; it never invents an instant. Ledger ordering is date then stable ID, and month filters use that observed/reviewed date. The broader domain validator's offset/Santiago groundwork is not financial endpoint support.

Schema migration 2 preserves existing accounts/workspaces and adds workspace-scoped evidence, proposals, canonical records and opaque HMAC exact-byte markers with composite foreign keys. Parsing/fingerprinting/validation occur before short write transactions; each mutation rechecks current membership. Approval atomically creates one record referring to unchanged evidence and removes the proposal; repeated valid approval returns the existing record. No draft saves exist; expected version is fixed at 1. Ignore atomically removes the proposal and unreferenced evidence/marker. Pending proposals expire after 30 days: reads/import/startup hide expired rows and perform bounded deletion, with a 100-row sweep each minute; a replay target beyond the batch is also removed. A fresh import after ignore/expiry creates a fresh proposal. Approved records and their replay markers remain for the workspace lifetime. Exact bytes deduplicate only within the selected workspace; no semantic deduplication is claimed. Key rotation/replay continuity requires future lifecycle design.

Lists use bounded SQL cursor pages (20 by default, ledger maximum 50); totals aggregate every canonical record matching the exact filters, independently of the current page. Incoming/outgoing cash-flow buckets exclude credit-card purchases, confirmed-direction credit purchases have a separate bucket, and unresolved amounts/counts are separate. Transfers are not expenses, entries are not income, and no reconciled balance is shown. Aggregates that exceed exact integer range return `TOTAL_OVERFLOW` rather than silently rounding.

Upload bounds are 1 MiB, 10-second headers (250 ms server check interval), 10-second body idle and 30-second total including preparse authentication. Upload admission has zero queue: two active per actor (429) and eight globally (503); parser admission allows two workers with zero queue and a five-second deadline. Busy responses include Retry-After. Disconnects/errors/deadlines release admission and clear buffers; worker termination ends transient decoding. Attachments are rejected at the maintained streaming parser's attachment event without consuming content. JSON limits remain separate at 16 KiB. Recognized SQLite busy/locked failures return retryable `STORE_UNAVAILABLE` (503 with Retry-After); writes roll back and may be retried. The server retains no raw MIME, bodies, headers, filenames, full accounts or arbitrary HTML.

Financial UI state stays in memory and uses account/workspace generations and abort signals. List polling preserves active review/filter forms; a late approval for A cannot reset a newer proposal B. Logout clears private views and sends a generic cross-tab invalidation immediately, before signout network completion; delayed/failed signout cannot restore the view through focus/pageshow/polling. A successful explicit login lifts that local intent. This does not promise server revocation when a signout request cannot reach the server.

## Explicit remaining gates

- Real email import and real/shared financial data remain prohibited for this checkpoint. Local tests use independently invented values only; no real email, mailbox or private financial DB was accessed.
- Santander received transfer/payment and online-payment formats, Banco de Chile received formats, Banco Estado and MercadoPago lack released extraction contracts. Other layouts fail unsupported. Remaining provider coverage prevents complete M2 acceptance.
- Full auth hardening, identifier/address failed-login policy, recovery/password-change/rotation, expired auth-row cleanup, full account/workspace deletion and owner transfer are unfinished. Approved data is workspace-owned; full owner deletion is a future gate.
- Shared HTTPS proxy/cookie/storage verification remains incomplete. The encrypted-storage flag is an operator assertion, not app encryption; usable Better Auth session tokens remain in SQLite. Do not use this checkpoint for shared real financial data.
- No production hosting, Google login, mailbox connection, semantic deduplication, transfer matching, reconciled balances, Project changes or merge occurred. Verification is a bounded functional regression proof, not a full security/accessibility audit or complete M2 Definition of Done.
