# M2 notification contracts

## Evidence and release boundary

On 2026-11-04 the user supplied descriptions of Banco de Chile and Santander notification wording, field labels and formatting, and authorized starting with these. The Overseer releases the four purchase text contracts below. Only structural rules are recorded; the user's financial values and account/customer identifiers are not retained. Tests use independently invented data. No real email, mailbox or private database was inspected.

The initial text-adapter checkpoint consumed already-extracted title/narrative fields. The subsequent synthetic local journey connects those adapters to bounded in-memory MIME/HTML decoding, persistent proposals/evidence, deliberate review and the saved ledger. A description of an HTML/table presentation does not establish every actual DOM or MIME variant. The implementation is verified with independently invented inputs, makes no bank-origin authenticity claim, and is not released for real financial data.

## Released purchase contracts

| Contract | Recognition | Financial interpretation | Hint |
| --- | --- | --- | --- |
| Banco de Chile account purchase | Heading `Cargo en Cuenta`; one purchase sentence with `con cargo a Cuenta`, masked four-digit suffix, merchant after `en`, date/time after `el` | Proposed `debit`, outgoing purchase | Account suffix; do not call it a card |
| Banco de Chile credit purchase | Heading `Compra con Tarjeta de Crédito`; one purchase sentence with `con Tarjeta de Crédito`, masked four-digit suffix, merchant, date/time | Proposed `credit_card_purchase`, outgoing purchase; excluded from bank-account cash outflow totals | Card suffix |
| Santander debit purchase | Heading `Transacción por` with amount; one purchase sentence with `Tarjeta de Débito terminada en`, four-digit suffix, merchant and transaction date | Proposed `debit`, outgoing purchase | Card suffix |
| Santander credit purchase | Same heading shape; explicit `Tarjeta de Crédito terminada en`, optionally masked four-digit suffix, merchant and transaction date | Proposed `credit_card_purchase`, outgoing purchase; excluded from bank-account cash outflow totals | Card suffix |

The final supplied Santander example was labeled Debit Card Purchase but its explicit wording describes credit. The recognition rule uses the explicit card wording; contradictory debit/credit text is rejected rather than guessed. Supporting HTML labels must not override the narrative's meaning. The purchase adapter receives separately extracted exact title and single narrative strings, not arbitrary body text. Its caller must reject conflicting surrounding fields before invoking it.

Shared rules:

- Currency is CLP under this Chile-specific contract, not an inference that every `$` denotes CLP. Reject conflicting currency indications.
- Amounts are positive safe integers. Periods separate thousands; decimal amounts, malformed grouping, conflicting amounts and overflow are invalid.
- Dates use `dd/mm/yyyy`, validated against the actual calendar. Normalize to a date-only `yyyy-mm-dd` proposed record.
- Chile purchase time is `HH:mm`. Retain observed local time only as minimized evidence with timezone explicitly unknown. Do not invent a Santiago/UTC offset or claim an instant. This financial endpoint approves calendar dates only (`DATE_ONLY_REQUIRED` for timestamps), orders by date/stable ID and groups by the observed/reviewed month. The broader domain validator's offset/Santiago groundwork does not establish financial endpoint support.
- Santander purchase date comes from the explicit purchase narrative. `Fecha de vencimiento` is never a transaction-date source. Missing purchase date stays unsupported/invalid.
- One unambiguous purchase per input. Reject conflicting/repeated purchase narratives, mixed card types, malformed required fields and oversized text/merchant values with safe codes.
- Keep proposal fields separate from immutable observed evidence. Category remains unassigned for review; an outgoing purchase is not automatically assigned an expense category.
- Only an allowlisted masked account/card suffix may survive extraction. No source text, full account/customer identifiers, arbitrary table contents, sensitive headers or filenames belong in the output.

## Released sent-transfer text contract

The user clarified that `Comprobante Transferencia de fondos` identifies a sent Santander transfer, while `Aviso de Transferencia de Fondos` identifies a received transfer. Direction is therefore established by the specific heading, not by origin/destination identifiers.

The Overseer releases the **sent** contract: exact receipt heading; date narrative `Te enviamos el detalle de la transferencia realizada el [dd/mm/yyyy].`; amount label `Monto transferido` and CLP amount with period thousands separators. The adapter consumes these already-extracted fields, validates amount/calendar date, and proposes `bank_transfer`, outgoing, date-only, unassigned category and generic label `Transferencia bancaria`. Do not call the amount an expense or infer a counterparty from an account identifier. Evidence retains no account identifiers. Timestamp/timezone remain unknown.

The **received** heading establishes incoming semantics only. Its date/amount layout has not been described, so do not reuse the sent adapter for it or claim received-payment support yet.

## Described but not released for parsing

**Santander online payment:** this is an additional family, not proof of a debit-card purchase. The description includes an aggregate paid amount, multiple destination rows and per-row amounts, and a due-date label. The user confirmed there is no payment date in the body; a date may occur only in email metadata. Neither the due date nor the email date establishes the payment date. A future proposal must show the missing date and require user confirmation before approval. Before release, resolve row completeness/total reconciliation and the intended one-record-versus-multiple-record behavior. Do not silently introduce a fifth canonical type or map these payments to card purchases. This checkpoint does not parse or use email headers for payment dates.

**Other requested coverage:** Banco de Chile received payments/transfers, Santander received payments, and all Banco Estado/MercadoPago families still lack contracts. Requested scope remains intact; unresolved coverage prevents complete M2 acceptance. Unsupported or unknown versions must fail honestly rather than use guessed fields.

## Current MIME/HTML envelope

The synthetic-only upload accepts one bounded MIME input after account/workspace authorization and same-origin validation. Maintained MailParser handles decoding in a terminable worker; parse5 extracts structural text without rendering HTML or fetching resources. Attachments, hidden blocks, malformed input and unfamiliar surrounding content fail safely. Nonempty text/HTML alternatives must agree. Sender/header dates never establish transaction authenticity or payment dates.

Purchase bodies must have the released heading and narrative, with optional known label/value pairs that agree: `Comercio`/`Destino`, `Monto`, transaction `Fecha`, observed `Hora`, and applicable masked account/card hints. Santander can show only the matching four suffix digits. Duplicate/conflicting labels, unknown fields and due-date tables are unsupported/ambiguous. Transfer bodies currently support the exact heading/date-narrative/amount-label/value envelope; additional account/identity sections remain unsupported and are never retained. Unknown bank boilerplate or versions can therefore be rejected. This is narrow, disclosed coverage rather than general real-bank HTML validation.

Raw data stays transient. Stored evidence contains only allowlisted observed fields; reviewed corrections do not rewrite it. Ignore and expiry remove pending evidence and replay markers together. See [app instructions and limits](../../app/README.md) for concrete upload/worker bounds, schema/lifecycle behavior and functional proofs.

## Continuation

The synthetic import/review/ledger flow is implemented. Remaining M2 work includes unresolved provider contracts, online-payment decisions, authentication/lifecycle hardening, owner-only workspace deletion and shared HTTPS/storage verification. Do not expand recognition from guesses or enable real local input from synthetic proof alone. Real local input and shared operation retain their separate gates in the milestone and security records.
