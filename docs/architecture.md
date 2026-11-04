# Architecture direction and invariants

## Approved direction

Budgeteer will operate around a generic workspace boundary and produce user-reviewable structured transaction records from dedicated-mailbox inputs. Email-derived evidence and the canonical financial record are separate concepts. Raw email is transient sensitive input, not an intended durable product datastore.

## Invariants

- Workspace terminology and domain boundaries remain generic for one or many members.
- A canonical ledger record must be distinguishable from the evidence used to propose or support it.
- Parsing should occur in memory where practical, retaining only minimized structured transaction and evidence data.
- Raw message bodies and sensitive headers must not enter normal logs, errors, analytics, or permanent storage.
- Structured records must store masked account hints rather than full account identifiers.
- Credentials and provider tokens require managed secrets and encryption.
- The app does not automatically delete provider mail; the upstream dedicated mailbox is initially the raw source and archive.

## M2 approved direction and architecture review

The user approved Node.js, TypeScript and SQLite for M2 (ADR 0004), with architectural design and review required before application implementation. Basic authentication and shared-workspace membership are M2 requirements. The OS account hosting the application is not the product user or workspace membership boundary. One shared application/store must serve its members; separate private local databases do not implement shared workspaces.

The detailed [M2 architecture](design/m2-architecture.md) is a review document: module/layer boundaries, maintained auth integration, membership policy, shared HTTPS topology, data lifecycle, transactions, migrations, validation and SQLite limits require review before implementation. Password versus Google identity, library details and operating configuration are design choices; no mailbox permissions or production deployment are authorized by the request for sign-in.

## Unresolved choices

The following are deliberately undecided: mailbox providers and integration protocol; production runtime/deployment platform and future database choice; credential/session encryption implementation; detailed membership roles and authorization model; exact evidence schema and retention duration; transaction matching, deduplication, and reconciliation rules; review workflow; and whether a future opt-in provider-mail deletion feature is appropriate after successful processing and recovery safeguards.

Next.js, TypeScript, Vercel, and Postgres were discussed in chat as recommendations, not accepted ADRs. The M2 Node.js/TypeScript/SQLite choice is now accepted in ADR 0004; Next.js, Vercel, Postgres, and production runtime/deployment remain unapproved. No unresolved item above is an implementation decision until approved through the applicable authority order.
