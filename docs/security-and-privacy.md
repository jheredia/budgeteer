# Security and privacy principles

## Sensitive data model

Raw email can contain financial details, identities, account numbers, one-time links, and sensitive headers. Treat it as high-sensitivity transient input. Minimized structured transaction and evidence data remains sensitive, even after raw content is discarded.

## Raw email lifecycle

Retrieve only what is needed from a dedicated mailbox. Parse in memory where practical and derive only the structured fields and minimized evidence needed for review, provenance, and operation. Do not permanently store raw MIME, message bodies, or sensitive headers. Do not include them in application logs, errors, traces, analytics, support exports, or test output.

If temporary raw storage is ever unavoidable, it must be encrypted, access-scoped, protected from logs and backups as appropriate, assigned a short explicit TTL, and deleted when the TTL expires. Its need, scope, and controls require an approved design decision before implementation.

The upstream dedicated mailbox remains the initial raw source and archive. Budgeteer must not automatically delete provider mail. A provider-side deletion feature may only be considered later as explicit user opt-in after successful processing and recovery considerations are designed and approved.

## Minimization and retention

Retain only fields necessary to create, review, explain, and operate structured records. Use masked account hints, never full account identifiers where a hint suffices. Define retention periods before adding each data class; unresolved retention details must be recorded as open questions, not inferred.

## Logging and redaction

Log operational events with safe identifiers and counts, not payloads. Redact or avoid personal data, financial values where unnecessary, tokens, credentials, raw bodies, and sensitive headers. Error handling must preserve useful diagnostics without serializing sensitive inputs. Analytics must not receive raw email or secrets.

## Secrets and access

Use managed secrets and encryption for credentials and provider tokens. Never commit credentials, place them in fixtures, or print them to terminal output. Apply least privilege and scope access by workspace and operation. Secret rotation, access auditing, and key-management details are unresolved implementation choices requiring future approval.

## Test data

By default agents and tooling must not open real emails. A future milestone may process a real local email only when its approved work packet explicitly authorizes that data access. Even then, local inputs remain ignored and must never be staged, copied into the repository, logged, pasted into chat or documentation, or durably stored. No real, redacted, or synthetic email files may be committed or pushed. All `.eml` and `.emlx` files are ignored everywhere without exception. Future parser tests must construct fully synthetic MIME or messages in memory at test runtime or use non-email structured unit inputs; email-file fixtures must not be stored in Git.

## Deletion and incidents

Deletion must be deliberate, auditable where appropriate, and compatible with recovery needs. If sensitive email content is exposed or suspected to be exposed, contain access, stop propagation, preserve only safe incident evidence, rotate affected credentials where applicable, assess scope, and follow the governing incident and notification process. Do not reproduce raw content in incident notes.


## M2 shared application design requirements

Basic application authentication and server-enforced workspace membership are now required in M2. A host OS account is an operating/deployment boundary, not the application identity model. Multiple members use the same workspace/store through independently authenticated browser sessions. The reviewed design must specify protected credentials/sessions, invitation and removal policy, access checks for every resource/summary/import/replay query, and workspace-scoped deletion that leaves unrelated accounts/workspaces intact.

The user requested no retained ignored data. Ignoring a proposal must therefore remove its financial fields, unreferenced evidence and replay fingerprint/tombstone; reimport may create a new proposal afterward. Raw-input, logging and no-email-file rules above remain unchanged. Actual raw provider samples remain unauthorized for agent access; assumed forthcoming examples do not establish parser support.

Authentication introduces new sensitive data classes. Their retention, password-hash/session behavior, secrets and encryption controls must be reviewed before implementation; no plaintext password or homemade authentication cryptography is authorized. Google identity is an alternative design path, not permission to request Gmail scopes or provision an external service.
