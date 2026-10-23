# Budgeteer M1 interactive prototype

A locally runnable Spanish (Chile) prototype using only synthetic structured in-memory data. Option 2's review-first layout uses a mostly green provisional palette. This is a prototype for user review, not a production application or stack decision.

## Run

Use the verified local static-server path with Node.js:

```sh
cd prototype
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Then open `http://127.0.0.1:4173/` on that machine. No dependency installation, account, secret or connection is required. Direct `file://` launch was not verified: the managed browser blocked file URLs with `ERR_BLOCKED_BY_ADMINISTRATOR`. The server serves static files only; there is no data API or backend persistence.

## Try the connected journeys

1. **Por revisar:** inspect the $28.500 proposal and its separate structured evidence. Choose a category and approve it. October's confirmed total changes from $428.500 to $457.000; the queue empties and the approved entry links to its record and evidence.
2. **Resumen:** select October or September; compare against another month. August has no confirmed spending and demonstrates the explicit zero-baseline explanation. Follow totals or category amounts into matching ledger filters.
3. **Movimientos:** combine month/category filters, clear them, open any confirmed record, and inspect its evidence. Pending or ignored proposals do not appear here.
4. **Fuentes:** inspect honest simulation, connection and privacy explanations. There is no live mailbox or sync control.
5. **Reiniciar demostración:** restore the starting data, then try **Ignorar**. The queue empties and the confirmed total stays $428.500. Reload also restores the initial state.

Keyboard: skip link focuses main without changing the current view; Tab reaches navigation and form controls; native selects support arrows; Enter approves; the mobile menu supports Enter and Escape. Route changes focus main. Evidence links focus the evidence heading without replacing the record URL.

## Synthetic state contract

`app.js` contains separate arrays for canonical ledger entries, pending proposals, minimized structured evidence, and ignored proposal identifiers. Each ledger entry retains an evidence reference. Approval is guarded against repeats and does not mutate the supporting evidence. All totals and comparisons derive from current ledger entries, grouped in `America/Santiago`. Dates, numbers and CLP use Chilean locale formatting.

Initial months: October $428.500 across three entries; September $392.000 across three entries; August $0. One $28.500 pending proposal is excluded until approved. Category, evidence and review behavior are UI hypotheses rather than an accepted production domain model.

## Verification

The cloud environment supplies Playwright and Chromium. With equivalent tooling available, run from the repository root:

```sh
node prototype/verify.cjs
```

Override `BUDGETEER_PREVIEW_URL` or `BUDGETEER_CHROMIUM` for another local URL/browser path. The script requires a running preview and checks real browser journeys, resets, zero baseline, filters/detail links, keyboard operation, viewport overflow, console errors, external requests and browser storage. Screenshots and machine-readable results are in `docs/design/m1/captures/`; visual review is in root `design-qa.md` and the Overseer audit.

Default sandbox startup initially returned `EPERM`; supported automatic permission review then approved the loopback server and local Chromium. The browser evidence uses local Chromium via Playwright, not the unavailable connected Browser app. No external publication occurred.

## Visual choices and limits

The original visual source is `../docs/design/m1/visual-option-2.png`; the generated green revision is `../docs/design/m1/visual-option-2-green.png`. No official Budgeteer hex tokens were available in tracked docs/assets or earlier starter code. Forest `#123C32`, action `#18704E`, selected `#28644F`, mint `#EAF5EF`, ink `#19352D` are provisional. System Arial/Helvetica sans-serif avoids remote font requests. Standard outline icons are copied from Lucide because that treatment matches the selected reference; license is in `assets/LICENSE-lucide`.

There is no persistence, authentication, ingestion, mailbox connection, raw email, real financial data, production insight algorithm, production-stack selection, or logo redesign. Refresh intentionally resets the demo. Browser checks and keyboard review are not a complete accessibility certification. Final user acceptance remains pending.
