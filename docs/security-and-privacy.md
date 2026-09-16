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

Git may contain only synthetic or irreversibly redacted fixtures. Real `.eml` files are ignored and must never be opened, copied, staged, modified, quoted, or committed. Redaction must not be reversible through surrounding context, stable identifiers, or retained raw source material.

## Deletion and incidents

Deletion must be deliberate, auditable where appropriate, and compatible with recovery needs. If sensitive email content is exposed or suspected to be exposed, contain access, stop propagation, preserve only safe incident evidence, rotate affected credentials where applicable, assess scope, and follow the governing incident and notification process. Do not reproduce raw content in incident notes unless separately authorized and protected.
