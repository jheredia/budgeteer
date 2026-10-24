# Budgeteer M2 — Stage 1 shared-account foundation

This checkpoint implements the reviewed Node.js/TypeScript/SQLite boundaries, maintained password authentication and shared workspace membership. It is not the complete M2 milestone. The accepted M1 prototype remains in `../prototype/`.

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

The owner creates a one-use, 24-hour invitation link and delivers it directly to the intended collaborator. New collaborators enroll through that invitation; existing accounts sign in and accept it. Each browser uses an individual account against the same application/database. A member cannot invite/remove others. Removing membership denies the next protected request. Existing contributor data will remain workspace-owned when financial flows are connected.

If bootstrap is interrupted after credential creation but before workspace creation, run setup again with the same account and correct password. The maintained auth library verifies the password before workspace recovery; it does not reset or reveal it. Invalid workspace input is validated before account creation.

## Maintained library adoption evidence

Pinned actual packages: Better Auth 1.7.12, Fastify 5.12.7, better-sqlite3 12.11.1, patched @fastify/static 10.1.7; lockfile is committed. Node typings target Node 24.

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
```

Browser proof requires Chromium (default `/usr/bin/chromium`, override `BUDGETEER_CHROMIUM`). The app/browser test opens port 4174 and must not collide with a running dev app. It creates runtime-generated synthetic credentials and a temporary DB under the OS temp directory, and removes them after the run. It never writes passwords/cookies/invitation secrets into logs or screenshots. Browser proof records are in `verification/`.

Checks cover raw signup guards, salted password storage, safe session DTOs, cookies/logout revocation, invitation one-use/member/owner boundaries, foreign-origin denial, two isolated browser accounts sharing persisted membership, third-account denial, removal, restart, unchanged-form preservation, delayed invitation response after cross-tab logout, bootstrap recovery, unsupported schema refusal, strict calendar dates and Santiago month boundaries. Actual listening-server/Chromium tests passed; HTTP route tests additionally use Fastify injection. This is not a complete security or accessibility audit.

## Explicit next-stage gates

- Persistent financial proposal/evidence/review/ledger flows are not connected yet. The UI says so rather than showing demo amounts as real records.
- No provider parser or import endpoint is enabled. Banco de Chile, Santander, Banco Estado and MercadoPago formats remain unverified until agreed example-derived contracts exist. No mailbox, real email or financial database was accessed. No email files/fixtures are committed.
- The domain validators are groundwork, not proof of an accepted production financial schema. Semantic deduplication, transfer matching and reconciled balances remain outside M2.
- Full auth adoption still needs broader failure/rate-limit/expiry/password-change and lifecycle coverage. Identifier-plus-address failed-login policy, account recovery/deletion, credential rotation and expired auth-row cleanup are not complete merely because library sign-in works.
- Default operation binds loopback. Another device needs one operator-configured HTTPS origin/reverse proxy targeting this same server/database. `shared-https` configuration requires HTTPS origin, an explicit trusted proxy and `BUDGETEER_ENCRYPTED_STORAGE_CONFIRMED=yes`. That last value is an operator assertion/prerequisite, **not encryption implemented by the app**. Shared-mode proxy/cookie/storage verification has not passed, so do not use this checkpoint for shared real financial data.
- No production hosting, Google login, email delivery, advanced permissions, Project changes or default-branch merge occurred.
