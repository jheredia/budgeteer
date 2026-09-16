# ADR 0001 Generic workspace model

## Status

Accepted.

## Context

Budgeteer needs a boundary that works for one person as well as multiple collaborating people. Calling that boundary a family would embed an unsupported relationship assumption into the domain model.

## Decision

Use a generic workspace boundary with members. Do not use family-specific domain names or require members to have any particular relationship.

## Consequences

Future authorization and membership behavior must support this generic terminology. Exact roles and permission rules remain unresolved.
