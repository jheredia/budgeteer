# ADR 0003 Raw email lifecycle

## Status

Accepted.

## Context

Raw email contains unnecessary sensitive content for most ongoing product functions. A dedicated upstream mailbox can remain the initial raw source and archive without Budgeteer retaining a second permanent raw-MIME store.

## Decision

Treat raw email as transient sensitive input. Parse in memory where practical and retain only minimized structured transaction and evidence data. Do not permanently store raw MIME, message bodies, or sensitive headers, or send them to logs, errors, analytics, or fixtures. If temporary raw storage is ever unavoidable, it must be encrypted, access-scoped, short-lived under an explicit TTL, and deleted. Budgeteer must not automatically delete provider mail.

## Consequences

Ingestion and observability designs must be privacy-first. A future provider-side deletion option is unresolved and may be considered only as explicit user opt-in after successful processing and recovery safeguards are approved.
