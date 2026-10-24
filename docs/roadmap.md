# Roadmap

## Definition of Done

Every milestone must leave a demonstrable, coherent, usable result. Scaffolding, a schema alone, disconnected components, or a partially implemented flow do not complete a milestone. Each code milestone must keep the app runnable, preserve completed workflows, deliver its new journey end-to-end, persist data correctly, and pass its acceptance checks. Unfinished milestones remain in progress. Design milestones must yield a reviewable interactive prototype. M0’s functional result is a safe, operationally governed repository.

## Milestone workflow

1. The Overseer launches `MX` in proposal-only mode.
2. `MX` proposes bounded development items and does not change code.
3. The Overseer challenges, amends, or approves the proposal.
4. The Overseer gives the final list to the user for manual creation in the matching GitHub Project iteration.
5. After the user confirms the items are ready, the Overseer releases `MX` to implement them.
6. `MX` codes, verifies, and delivers against those item titles.
7. The Overseer reports the review-ready items to the user so they can be left in `In review` for acceptance.

GitHub Project mutations remain manual unless the user explicitly authorizes a different workflow. Milestone agents communicate directly with the single Overseer in the current task; each milestone uses a dedicated branch. Separate sidebar chats are optional for independent new tasks. See `AGENTS.md`. M1 has an explicit user-authorized implementation exception; Project creation remains unconfirmed and is not inferred.

| Milestone | Vertical outcome | Dependencies | Status | Task or thread |
| --- | --- | --- | --- | --- |
| M0 | Safe, governed repository | None | Complete; user approved 2026-10-22 and published to `origin/master` 2026-10-23 | `codex/m0-governance-corrections`; Overseer task: Budgeteer — Overseer |
| M1 | Reviewable interactive product and UX prototype using synthetic data | M0 | Complete; user accepted local review 2026-10-23; published on milestone branch | Cloud Overseer; `m1_implementation` subagent on `codex/m1-product-ux-prototype` |
| M2 | First usable authenticated shared-workspace app: import an authorized local email, review it, and see persistent shared ledger/totals; includes technical setup and reviewed architecture | M1 | Architecture independently reviewed/Overseer approved; common implementation released; provider/adoption gates and Project readiness pending | `codex/m2-local-app`; internal proposal agent under Cloud Overseer |
| M3 | Working dedicated-inbox synchronization with idempotency and recovery | M2 | Planned | Not assigned |
| M4 | Working categorization, duplicate handling, card-payment and refund handling, and internal-transfer matching | M3 | Planned | Not assigned |
| M5 | Working evidence-backed financial insights | M4 | Planned | Not assigned |
| M6 | Extended shared-workspace permissions and membership lifecycle beyond the basic authenticated sharing delivered in M2, with solo use still valid | M5 | Planned | Not assigned |
| M7 | Deployed, monitored, recoverable production release | M6 | Planned | Not assigned |

M0 is integrated into `master` and published to GitHub after explicit user authorization. No real, redacted, or synthetic email files may be committed or pushed. Parser tests must construct synthetic messages in memory at test runtime or use non-email structured unit inputs. Future milestone packets must explicitly approve their scope, acceptance checks, and any required sensitive-data access. Statuses describe the actual state of work; task or thread identifiers are added only when known.
