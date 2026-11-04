import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSentTransferText,
  type ExtractedSentTransferText,
} from "../server/imports/transfer-adapter.js";
import { validateReviewedFields } from "../server/domain/model.js";

// Entirely invented values; structured strings generated at runtime, no email fixtures.
function sample(
  overrides: Partial<ExtractedSentTransferText> = {},
): ExtractedSentTransferText {
  return {
    contract: "santander_sent_transfer_v1",
    title: "Comprobante Transferencia de fondos",
    dateNarrative: `Te enviamos el detalle de la transferencia realizada el ${"17/06/2025"}.`,
    amountLabel: "Monto transferido",
    amountText: `$ ${"63.710"}`,
    ...overrides,
  };
}

test("explicit sent-transfer contract yields outgoing date-only review fields and immutable evidence", () => {
  const result = parseSentTransferText(sample());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.proposedFields, {
    label: "Transferencia bancaria",
    amount: 63710,
    occurredAt: "2025-06-17",
    category: "",
    type: "bank_transfer",
    direction: "outgoing",
  });
  assert.deepEqual(
    validateReviewedFields(result.proposedFields),
    result.proposedFields,
  );
  assert.deepEqual(result.evidence, {
    contract: "santander_sent_transfer_v1",
    extractionVersion: 1,
    sourceAuthentication: "unverified",
    currency: "CLP",
    amount: 63710,
    date: "2025-06-17",
    timezone: "unknown",
  });
  for (const value of [result, result.proposedFields, result.evidence])
    assert.equal(Object.isFrozen(value), true);
  assert.throws(
    () => Object.assign(result.evidence, { date: "2025-06-18" }),
    TypeError,
  );
});

test("sent-transfer amount is positive safe integer CLP, optional single space, strict dot thousands", () => {
  for (const [amountText, amount] of [
    ["$1", 1],
    ["$ 999", 999],
    ["$1.000", 1000],
    ["$ 9.007.199.254.740.991", Number.MAX_SAFE_INTEGER],
  ] as const) {
    const result = parseSentTransferText(sample({ amountText }));
    assert.equal(result.ok, true, amountText);
    if (result.ok) assert.equal(result.proposedFields.amount, amount);
  }
  for (const amountText of [
    "$0",
    "$-1",
    "$01",
    "$1,5",
    "$1.50",
    "$1000",
    "$01.000",
    "$1.000,00",
    "$1e3",
    "$1_000",
    "$9.007.199.254.740.992",
    "$  1.000",
    "$\t1.000",
    " $1.000",
    "$1.000 ",
    "$1.000 USD",
    "$1.000 $2.000",
    "1.000",
    "CLP 1.000",
  ]) {
    assert.equal(
      parseSentTransferText(sample({ amountText })).ok,
      false,
      amountText,
    );
  }
});

test("only the explicit valid Gregorian transaction date supplies occurredAt", () => {
  for (const date of ["29/02/2024", "29/02/2000", "28/02/1900", "31/12/9999"]) {
    const result = parseSentTransferText(
      sample({
        dateNarrative: `Te enviamos el detalle de la transferencia realizada el ${date}.`,
      }),
    );
    assert.equal(result.ok, true, date);
  }
  for (const date of [
    "29/02/2025",
    "29/02/1900",
    "31/04/2025",
    "00/06/2025",
    "17/00/2025",
    "17/13/2025",
    "01/01/1899",
    "17/6/2025",
    "2025-06-17",
    "17/06/20250",
    "17/06/2025 17:45",
  ]) {
    assert.equal(
      parseSentTransferText(
        sample({
          dateNarrative: `Te enviamos el detalle de la transferencia realizada el ${date}.`,
        }),
      ).ok,
      false,
      date,
    );
  }
  for (const dateNarrative of [
    "",
    "Fecha de vencimiento: 20/06/2025",
    "Fecha del correo: 17/06/2025",
    "Te enviamos el detalle de la transferencia realizada.",
    sample().dateNarrative + " Fecha de vencimiento: 20/06/2025",
    sample().dateNarrative + " " + sample().dateNarrative,
  ]) {
    assert.equal(parseSentTransferText(sample({ dateNarrative })).ok, false);
  }
});

test("received-transfer title has no approved amount/date extraction contract", () => {
  assert.deepEqual(
    parseSentTransferText(
      sample({ title: "Aviso de Transferencia de Fondos" }),
    ),
    { ok: false, code: "UNSUPPORTED_FORMAT" },
  );
  assert.deepEqual(
    parseSentTransferText({
      ...sample(),
      contract: "santander_received_transfer_v1",
    }),
    { ok: false, code: "UNSUPPORTED_CONTRACT" },
  );
});

test("exact selected title, labels and bounded extracted strings reject unsupported or malformed inputs", () => {
  for (const overrides of [
    { title: "Comprobante Transferencia de fondos $63.710" },
    { title: "Transferencia de fondos" },
    { amountLabel: "Monto recibido" },
    { amountLabel: "Monto transferido: Monto transferido" },
    { title: "x".repeat(121) },
    { dateNarrative: "x".repeat(161) },
    { amountLabel: "x".repeat(81) },
    { amountText: "x".repeat(41) },
    { dateNarrative: sample().dateNarrative + "\n" },
    { title: "Comprobante Transferencia de fon\u200bdos" },
    { dateNarrative: "<p>" + sample().dateNarrative + "</p>" },
  ])
    assert.equal(parseSentTransferText(sample(overrides)).ok, false);
  for (const input of [
    null,
    undefined,
    "private payload",
    {},
    { ...sample(), contract: undefined },
    { ...sample(), amountText: null },
    { ...sample(), dateNarrative: undefined },
  ]) {
    const result = parseSentTransferText(input);
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(result).sort(), ["code", "ok"]);
  }
});

test("additional unapproved fields are never copied into proposals, evidence or diagnostics", () => {
  const result = parseSentTransferText({
    ...sample(),
    account: "synthetic full identifier",
    counterparty: "Invented Person",
    merchant: "Do not infer",
    body: "private body",
    sender: "unverified sender",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(Object.keys(result.evidence).sort(), [
    "amount",
    "contract",
    "currency",
    "date",
    "extractionVersion",
    "sourceAuthentication",
    "timezone",
  ]);
  assert.deepEqual(Object.keys(result.proposedFields).sort(), [
    "amount",
    "category",
    "direction",
    "label",
    "occurredAt",
    "type",
  ]);
  for (const excluded of [
    "synthetic full identifier",
    "Invented Person",
    "Do not infer",
    "private body",
    "unverified sender",
    "Te enviamos",
  ])
    assert.equal(JSON.stringify(result).includes(excluded), false);
});
