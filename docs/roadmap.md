# Roadmap

## Definition of Done

Every milestone must leave a demonstrable, coherent, usable result. Scaffolding, a schema alone, disconnected components, or a partially implemented flow do not complete a milestone. Each code milestone must keep the app runnable, preserve completed workflows, deliver its new journey end-to-end, persist data correctly, and pass its acceptance checks. Unfinished milestones remain in progress. Design milestones must yield a reviewable interactive prototype. M0’s functional result is a safe, operationally governed repository.

| Milestone | Vertical outcome | Dependencies | Status | Task or thread |
| --- | --- | --- | --- | --- |
| M0 | Safe, governed repository | None | Under review on branch; not merged or released | `codex/m0-governance-corrections`; Overseer task: Budgeteer — Overseer |
| M1 | Reviewable interactive product and UX prototype using synthetic data | M0 | Planned | Not assigned |
| M2 | First usable local app: import an authorized local email, review it, and see the ledger and totals; includes all technical setup | M1 | Planned | Not assigned |
| M3 | Working dedicated-inbox synchronization with idempotency and recovery | M2 | Planned | Not assigned |
| M4 | Working categorization, duplicate handling, card-payment and refund handling, and internal-transfer matching | M3 | Planned | Not assigned |
| M5 | Working evidence-backed financial insights | M4 | Planned | Not assigned |
| M6 | Working multi-member workspaces and permissions, with solo use still valid | M5 | Planned | Not assigned |
| M7 | Deployed, monitored, recoverable production release | M6 | Planned | Not assigned |

No real, redacted, or synthetic email files may be committed or pushed. Parser tests must construct synthetic messages in memory at test runtime or use non-email structured unit inputs. Future milestone packets must explicitly approve their scope, acceptance checks, and any required sensitive-data access. Statuses describe the actual state of work; task or thread identifiers are added only when known.
