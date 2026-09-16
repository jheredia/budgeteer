# ADR 0002 Evidence and canonical ledger

## Status

Accepted.

## Context

Email-derived data can be incomplete, duplicated, delayed, or incorrect. The product needs provenance without making an input notification the unquestioned financial truth.

## Decision

Model minimized evidence separately from the canonical ledger record. Evidence may support a proposed or reviewed record, but it is not itself the canonical ledger.

## Consequences

Future schemas and review flows must preserve this distinction. The precise evidence schema, matching rules, reconciliation rules, and review lifecycle are unresolved.
