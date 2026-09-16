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

## Unresolved choices

The following are deliberately undecided: mailbox providers and integration protocol; runtime and deployment platform; database and encryption implementation; membership roles and authorization model; exact evidence schema and retention duration; transaction matching, deduplication, and reconciliation rules; review workflow; and whether a future opt-in provider-mail deletion feature is appropriate after successful processing and recovery safeguards.

No unresolved item above is an implementation decision until approved through the applicable authority order.
