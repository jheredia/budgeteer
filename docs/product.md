# Product direction

## Workspace terminology

A **workspace** is the generic boundary for Budgeteer data and membership. It supports one member or multiple members; product and domain names must not assume a family relationship. A **member** belongs to a workspace. A **transaction record** is a structured, reviewable financial record. **Evidence** is minimized structured information derived from an input that supports a transaction record without retaining the raw email.

## Goals

- Track and categorize expenses and present a clear picture of spending.
- Provide cautious comparisons and insights grounded in available evidence, with uncertainty visible.
- Turn transaction notifications into understandable, reviewable records; email ingestion is a means, not the product itself.
- Preserve provenance and uncertainty so users can correct or reject extraction results.
- Make privacy and minimization default behaviors, especially for email-derived data.
- Support a workspace that can remain personal or be shared with additional members.

## Initial users and use cases

Initial users are individuals managing a personal workspace and small groups sharing a workspace, including couples and families. Shared awareness and contribution are core product goals; workspace/member domain names remain generic for any relationship. Basic authenticated sharing is required in M2 rather than deferred to M6. Initial use cases are connecting a dedicated mailbox, identifying potential transaction notifications, extracting a proposed structured record, reviewing it, and understanding the evidence behind it. Multi-member permissions, provider support, and the review flow remain future design work unless approved in a milestone.

## Non-goals

- Replacing a bank, card issuer, accounting system, or legal tax advice.
- Treating email notifications as unquestioned financial truth.
- Storing an archive of raw email or automatically deleting mail from a provider.
- Assuming every workspace is a family or imposing a relationship model on members.
- Building automated payments, money movement, credit decisions, or investment advice in the initial product.

## Product principles

User review overrides automation. Evidence is distinct from the canonical ledger. Data collection is minimized and purposeful. Privacy protections are part of the product behavior, not a deployment afterthought. Ambiguity should be visible to the user and to future maintainers rather than hidden by a guessed decision.
