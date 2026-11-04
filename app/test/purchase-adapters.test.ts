import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePurchaseText,
  type ExtractedPurchaseText,
  type PurchaseContract,
} from "../server/imports/purchase-adapters.js";
import { validateReviewedFields } from "../server/domain/model.js";

// Invented values, constructed as non-email structured inputs at runtime only.
function sample(
  contract: PurchaseContract,
  overrides: Partial<ExtractedPurchaseText> = {},
): ExtractedPurchaseText {
  const credit = contract.includes("credit");
  const chile = contract.startsWith("banco_chile_");
  const merchant = "Comercio Inventado Luna";
  const date = "29/02/2024";
  const last4 = "6073";
  return {
    contract,
    title: chile
      ? credit
        ? "Compra con Tarjeta de Crédito"
        : "Cargo en Cuenta"
      : `Transacción por $${"37.820"}`,
    narrative: chile
      ? `Te informamos que se ha realizado una compra por $${"37.820"} ${credit ? "con Tarjeta de Crédito" : "con cargo a Cuenta"} ****${last4} en ${merchant} el ${date} 21:47.`
      : `Se realizó una compra con tu Tarjeta de ${credit ? "Crédito" : "Débito"} terminada en ${credit ? "****" : ""}${last4} en ${merchant}, el ${date}`,
    ...overrides,
  };
}
const contracts: PurchaseContract[] = [
  "banco_chile_debit_v1",
  "banco_chile_credit_v1",
  "santander_debit_v1",
  "santander_credit_v1",
];

test("four explicit purchase contracts produce bounded review proposals and minimized observations", () => {
  for (const contract of contracts) {
    const result = parsePurchaseText(sample(contract));
    assert.equal(result.ok, true, contract);
    if (!result.ok) continue;
    assert.deepEqual(result.proposedFields, {
      label: "Comercio Inventado Luna",
      amount: 37820,
      occurredAt: "2024-02-29",
      category: "",
      type: contract.includes("credit") ? "credit_card_purchase" : "debit",
      direction: "outgoing",
    });
    assert.deepEqual(
      validateReviewedFields(result.proposedFields),
      result.proposedFields,
    );
    assert.deepEqual(result.evidence, {
      contract,
      extractionVersion: 1,
      sourceAuthentication: "unverified",
      currency: "CLP",
      amount: 37820,
      merchant: "Comercio Inventado Luna",
      date: "2024-02-29",
      localTime: contract.startsWith("banco_chile_") ? "21:47" : null,
      timezone: "unknown",
      instrument: {
        kind: contract === "banco_chile_debit_v1" ? "account" : "card",
        maskedLast4: "****6073",
      },
    });
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.proposedFields), true);
    assert.equal(Object.isFrozen(result.evidence), true);
    assert.equal(Object.isFrozen(result.evidence.instrument), true);
    assert.throws(
      () =>
        Object.assign(result.evidence.instrument, { maskedLast4: "****1111" }),
      TypeError,
    );
    assert.equal(JSON.stringify(result).includes("Te informamos"), false);
    assert.equal(JSON.stringify(result).includes("Se realizó"), false);
  }
});

test("Santander credit permits explicit unmasked last4 and an optional sentence period", () => {
  const input = sample("santander_credit_v1");
  input.narrative = input.narrative.replace("****6073", "6073") + ".";
  const result = parsePurchaseText(input);
  assert.equal(result.ok, true);
  if (result.ok)
    assert.equal(result.evidence.instrument.maskedLast4, "****6073");
});

test("isolated merchant processor separators are retained without accepting account masks", () => {
  for (const contract of contracts) {
    const input = sample(contract);
    const result = parsePurchaseText({
      ...input,
      narrative: input.narrative.replace(
        "Comercio Inventado Luna",
        "PAGO*TIENDA FICTICIA",
      ),
    });
    assert.equal(result.ok, true);
    if (result.ok)
      assert.equal(result.proposedFields.label, "PAGO*TIENDA FICTICIA");
  }
});

test("positive safe-integer CLP uses strict dot grouping under the selected contract", () => {
  for (const contract of contracts) {
    const input = sample(contract);
    const field = contract.startsWith("banco_chile_") ? "narrative" : "title";
    for (const [text, expected] of [
      ["1", 1],
      ["999", 999],
      ["1.000", 1000],
      ["9.007.199.254.740.991", Number.MAX_SAFE_INTEGER],
    ] as const) {
      const result = parsePurchaseText({
        ...input,
        [field]: input[field].replace("37.820", text),
      });
      assert.equal(result.ok, true, `${contract}: ${text}`);
      if (result.ok) assert.equal(result.proposedFields.amount, expected);
    }
    for (const amount of [
      "0",
      "00",
      "01",
      "-1",
      "+1",
      "1,25",
      "1.50",
      "1234",
      "01.000",
      "1.000,00",
      "1.000.00",
      "1e3",
      "1_000",
      "9.007.199.254.740.992",
      "1.000 USD",
      " 1.000",
      "1.000 ",
    ]) {
      assert.equal(
        parsePurchaseText({
          ...input,
          [field]: input[field].replace("37.820", amount),
        }).ok,
        false,
        amount,
      );
    }
  }
});

test("dates are explicit valid Gregorian dates; Chile local times never acquire an offset", () => {
  for (const contract of contracts) {
    const input = sample(contract);
    for (const date of [
      "29/02/2023",
      "31/04/2024",
      "00/01/2024",
      "01/00/2024",
      "01/13/2024",
      "01/01/1899",
      "1/02/2024",
      "2024-02-29",
      "29/02/20240",
      "29/02/2024 17:00",
    ]) {
      assert.equal(
        parsePurchaseText({
          ...input,
          narrative: input.narrative.replace("29/02/2024", date),
        }).ok,
        false,
        date,
      );
    }
    for (const date of ["28/02/1900", "29/02/2000", "31/12/9999"]) {
      assert.equal(
        parsePurchaseText({
          ...input,
          narrative: input.narrative.replace("29/02/2024", date),
        }).ok,
        true,
        date,
      );
    }
    if (!contract.startsWith("banco_chile_")) continue;
    for (const time of [
      "24:00",
      "21:60",
      "-1:00",
      "1:00",
      "21:47:00",
      "21:47Z",
      "21:47-03:00",
      "21:470",
    ]) {
      assert.equal(
        parsePurchaseText({
          ...input,
          narrative: input.narrative.replace("21:47", time),
        }).ok,
        false,
        time,
      );
    }
    for (const time of ["00:00", "23:59"]) {
      const result = parsePurchaseText({
        ...input,
        narrative: input.narrative.replace("21:47", time),
      });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.proposedFields.occurredAt, "2024-02-29");
        assert.equal(result.evidence.localTime, time);
        assert.equal(result.evidence.timezone, "unknown");
      }
    }
  }
});

test("ambiguous purchase sentences, duplicate amounts and conflicting debit/credit fail closed", () => {
  for (const contract of contracts) {
    const input = sample(contract);
    for (const narrative of [
      input.narrative + " " + input.narrative,
      input.narrative.replace(
        "Comercio Inventado Luna",
        "Comercio Inventado Luna $37.820",
      ),
      input.narrative.replace(
        "Comercio Inventado Luna",
        "Comercio Inventado Luna $58.110",
      ),
      input.narrative + " Tarjeta de Débito y Tarjeta de Crédito",
    ]) {
      assert.deepEqual(parsePurchaseText({ ...input, narrative }), {
        ok: false,
        code: "AMBIGUOUS_INPUT",
      });
    }
    assert.equal(
      parsePurchaseText({
        ...input,
        narrative: input.narrative.replace(
          "Comercio Inventado Luna",
          "Comercio Inventado Luna 58.110",
        ),
      }).ok,
      false,
    );
    assert.equal(
      parsePurchaseText({ ...input, title: input.title + " $58.110" }).ok,
      false,
    );
  }
});

test("bounded single narratives reject unsupported body content, full identifiers and malformed fields", () => {
  for (const contract of contracts) {
    const input = sample(contract);
    for (const merchant of [
      "",
      " ",
      "a".repeat(121),
      "Comercio\nOculto",
      "<b>Comercio</b>",
      "Comercio 123456789012",
      "Comercio ****6073",
      "Comercio 01/03/2024",
      "Comercio 12:34",
    ]) {
      assert.equal(
        parsePurchaseText({
          ...input,
          narrative: input.narrative.replace(
            "Comercio Inventado Luna",
            merchant,
          ),
        }).ok,
        false,
        merchant,
      );
    }
    for (const ending of ["607", "60731", "1234567890126073", "607x"]) {
      assert.equal(
        parsePurchaseText({
          ...input,
          narrative: input.narrative.replace("6073", ending),
        }).ok,
        false,
      );
    }
    for (const narrative of [
      input.narrative + " texto adicional",
      "<html>" + input.narrative + "</html>",
      input.narrative + "\n",
      input.narrative.replace("Luna", "Lu\u200bna"),
      "x".repeat(513),
    ]) {
      assert.equal(parsePurchaseText({ ...input, narrative }).ok, false);
    }
  }
});

test("Santander due dates never substitute for the purchase narrative date", () => {
  for (const contract of [
    "santander_debit_v1",
    "santander_credit_v1",
  ] as const) {
    const input = sample(contract);
    for (const narrative of [
      "Fecha de vencimiento: 08/03/2024",
      input.narrative.replace(
        ", el 29/02/2024",
        ", Fecha de vencimiento: 08/03/2024",
      ),
      input.narrative + " Fecha de vencimiento: 08/03/2024",
    ]) {
      assert.equal(parsePurchaseText({ ...input, narrative }).ok, false);
    }
  }
});

test("caller selection is mandatory and failures expose only fixed codes", () => {
  for (const input of [
    null,
    undefined,
    1,
    "private text",
    {},
    { contract: "banco_estado_debit_v1" },
    { ...sample("banco_chile_debit_v1"), contract: undefined },
    { ...sample("banco_chile_debit_v1"), title: null },
  ]) {
    const result = parsePurchaseText(input);
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(result).sort(), ["code", "ok"]);
  }
  const chile = sample("banco_chile_debit_v1");
  assert.equal(
    parsePurchaseText({ ...chile, contract: "santander_debit_v1" }).ok,
    false,
  );
  const result = parsePurchaseText({
    ...chile,
    source: "untrusted sender",
    rawBody: "private text",
    fullAccount: "discarded",
  });
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(result).includes("private text"), false);
  assert.equal(JSON.stringify(result).includes("fullAccount"), false);
});
