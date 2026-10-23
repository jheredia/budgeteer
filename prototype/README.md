# M1 representative review surface — paused, unverified

This is work in progress for the selected option 2 visual direction, recolored with provisional greens. It is not the complete M1 milestone and has not passed the visual checkpoint.

Only the representative transaction-review surface is implemented in source: responsive shell, category selection, approve/ignore feedback, synthetic in-memory total and reset. Overview/ledger/source journeys are not implemented; their navigation entries are disabled. There is no backend, persistence, authentication, mailbox integration, real data or external network request.

## Local launch after the coordination pause is resolved

Requires Node.js. No dependency installation is needed.

```sh
cd prototype
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/` on that machine. The server defaults to loopback. Reload resets all state; the post-action reset button also restores the synthetic starting state. This Node static server and plain HTML/CSS/JS are disposable prototype tooling, not a production-stack choice.

## Current verification limits

JavaScript syntax checks passed. Server startup attempts in the cloud sandbox failed with `listen EPERM` at both `0.0.0.0:4173` and `127.0.0.1:4173`; no server is running. No escalation was requested. No rendered screenshots, interaction checks or browser-console checks have been completed. The source therefore must not be described as runnable or visually verified yet.

The Overseer requested an immediate pause to resolve the user's separate milestone-conversation requirement. Do not resume server, screenshot or implementation work until coordination is resolved and the Overseer releases the task.

## Visual source and assets

See `../docs/design/m1/visual-option-2.png` (original) and `../docs/design/m1/visual-option-2-green.png` (generated green revision). Greens are provisional: forest `#123C32`, action `#18704E`, selected `#28644F`, mint `#EAF5EF`, ink `#19352D`. No official Budgeteer hex values were found in tracked docs/assets or historical starter source.

Standard outline icons are copied from the installed Lucide icon library, chosen to match the reference's simple outline icon treatment. They are library assets, not handcrafted drawings. License is in `assets/LICENSE-lucide`. No custom illustration or logo asset is used.
