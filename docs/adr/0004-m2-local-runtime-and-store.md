# ADR 0004 M2 runtime and persistent store

## Status

Accepted by explicit user instruction on 2026-10-23. Approval covers Node.js, TypeScript and SQLite for M2. Application implementation must wait for architectural design and review.

## Context

M1 delivered an accepted synthetic in-memory prototype. M2 needs a maintainable application with durable records and shared authenticated workspace use. Runtime/store choice does not by itself define deployment, authentication, permissions, retention or module architecture.

## Decision

Use Node.js and TypeScript for the M2 application with SQLite for persistent data. Reuse the accepted M1 visual direction. Design and review the architecture before implementation. Sharing is an application-account/workspace capability, not a requirement that each member have an OS account or a separate private database.

## Consequences

Module design, library selection, migrations, authentication/session handling, minimal membership policy, deployment reachability and credential storage must be specified and reviewed. A later database/platform change remains an explicit decision; repository interfaces do not make a database migration automatic. No production hosting/platform or Google identity/mailbox integration is selected by this ADR. Accepted ADRs 0001–0003 remain in force.
