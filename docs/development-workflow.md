# Milestone branches and development stages

One Overseer coordinates internal milestone agents directly. Each milestone owns a branch/worktree. The user manages Project creation/status and acceptance; merging into `master` needs separate authorization.

## Pull request boundaries

Use one PR per milestone, kept draft until its complete outcome is verified. Architecture, foundation, feature and validation stages are reviewed commits/checkpoints within that PR. Do not create a long PR stack for every small development task.

Normally branch from current accepted `master`. If the preceding milestone is accepted but unmerged, the next milestone may temporarily descend from it and target its PR at that parent branch. Current ancestry is `master` ← `codex/m1-product-ux-prototype` ← `codex/m2-local-app`. No PR is asserted to exist merely because these branches are published.

After the parent merges, retarget the child PR to `master` and recheck the diff/integration. Prefer a merge commit while dependent branches are active so ancestry is preserved and local checkouts need no rewrite. If squash/rebase merging is chosen, coordinate restacking explicitly; never silently force-push or merge the default branch.

## M2 stages

1. **Architecture:** module/service/repository boundaries, authentication/membership, topology and privacy. Independent review and Overseer review passed before code was released.
2. **Shared foundation:** maintained-auth/SQLite compatibility, protected bootstrap, sign-in, invitations, membership and persistence. Prove two independent accounts share one store, a nonmember is denied, logout revokes access, and restart preserves records.
3. **Import contracts/pipeline:** bounded private in-memory input handling; provider adapters only after actual notification contracts are known. Forthcoming examples do not establish support. No agent real-email access or committed email files.
4. **Review/read journeys:** atomic approve/ignore, immutable evidence, persistent ledger/filters/summaries, workspace controls and browser identity isolation. Common contracts permit progress while provider-specific formats remain gated.
5. **Verification/acceptance:** integrated browser/API/data, privacy, failure/restart/race, keyboard/mobile and shared-user checks. Report evidence and limits; return items ready for manual review. A stage alone cannot complete M2.

Keep M1's demo runnable separately. Push reviewed checkpoints to the authorized milestone branch for local fetching; do not automatically merge, deploy, change Project status, or expose network access.

## Resume state on 2026-10-24

M2 resumed at clean `31c32bd`. The previous implementation attempt stopped at a usage limit before writing code. The internal worker has resumed the common foundation under existing authorization. Board creation remains unconfirmed; provider contracts and credential/shared-operation checks remain gated. No complete M2 authentication/parser is claimed by this record.


## Open pull requests

- [M1 PR #1](https://github.com/jheredia/budgeteer/pull/1): `codex/m1-product-ux-prototype` → `master`, accepted prototype ready for integration review; no default-branch merge performed.
- [M2 draft PR #2](https://github.com/jheredia/budgeteer/pull/2): `codex/m2-local-app` → `codex/m1-product-ux-prototype`, staged work in progress.

M1 reconciles `origin/master` history in milestone-branch commit `48de513`; its file tree is identical to accepted M1 commit `ba36146`. This resolves old documentation conflicts without changing the accepted prototype, rewriting history or merging into `master`. Both PRs were reported mergeable after creation. Keep M2 draft until its complete acceptance criteria pass, and retarget it after M1 is merged with separate authorization.
