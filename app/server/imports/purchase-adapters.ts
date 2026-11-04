import { validOccurredAt, type ReviewedFields } from "../domain/model.js";

/** Explicit recognition contracts, not authenticated assertions of bank origin. */
export type PurchaseContract =
  | "banco_chile_debit_v1"
  | "banco_chile_credit_v1"
  | "santander_debit_v1"
  | "santander_credit_v1";

/**
 * Already-extracted exact title and single narrative; not a message/body parser.
 * The caller must decode/extract and reject conflicting fields before calling.
 */
export interface ExtractedPurchaseText {
  contract: PurchaseContract;
  title: string;
  narrative: string;
}

export interface PurchaseEvidence {
  readonly contract: PurchaseContract;
  readonly extractionVersion: 1;
  readonly sourceAuthentication: "unverified";
  readonly currency: "CLP";
  readonly amount: number;
  readonly merchant: string;
  readonly date: string;
  readonly localTime: string | null;
  readonly timezone: "unknown";
  readonly instrument: Readonly<{
    kind: "account" | "card";
    maskedLast4: string;
  }>;
}

export type PurchaseParseResult =
  | Readonly<{
      ok: true;
      proposedFields: Readonly<ReviewedFields>;
      evidence: PurchaseEvidence;
    }>
  | Readonly<{
      ok: false;
      code:
        | "UNSUPPORTED_CONTRACT"
        | "UNSUPPORTED_FORMAT"
        | "INVALID_INPUT"
        | "AMBIGUOUS_INPUT";
    }>;

const contracts: readonly PurchaseContract[] = [
  "banco_chile_debit_v1",
  "banco_chile_credit_v1",
  "santander_debit_v1",
  "santander_credit_v1",
];
const amountPattern = "([1-9]\\d{0,2}(?:\\.\\d{3})*)";
const datePattern = "(\\d{2}/\\d{2}/\\d{4})";
const merchantPattern = "(.{1,120}?)";

function failure(
  code: Extract<PurchaseParseResult, { ok: false }>["code"],
): PurchaseParseResult {
  return Object.freeze({ ok: false, code });
}

function calendarDate(value: string): string | null {
  const [day, month, year] = value.split("/");
  const date = `${year}-${month}-${day}`;
  return validOccurredAt(date) ? date : null;
}

function validMerchant(value: string): boolean {
  // Do not let another field or sentence disappear into the merchant capture.
  return (
    value === value.trim() &&
    /^[\p{L}\p{M}\p{N} *&'’.,()/#+_-]+$/u.test(value) &&
    !/\d{5,}|\d[.,]\d|\d{1,4}[/:-]\d|\*{2}|\b(?:compra|cuenta|tarjeta|vencimiento)\b/iu.test(
      value,
    ) &&
    !/[.!?]$/.test(value)
  );
}

/**
 * All values are minimized observations pending review. Currency is fixed by
 * the selected contract, never inferred from a dollar symbol. No offset or
 * instant is invented for an observed local time. Nothing here persists input.
 */
export function parsePurchaseText(input: unknown): PurchaseParseResult {
  if (!input || typeof input !== "object") return failure("INVALID_INPUT");
  const value = input as Partial<ExtractedPurchaseText>;
  if (!contracts.includes(value.contract as PurchaseContract))
    return failure("UNSUPPORTED_CONTRACT");
  const contract = value.contract as PurchaseContract;
  const { title, narrative } = value;
  if (
    typeof title !== "string" ||
    typeof narrative !== "string" ||
    title.length > 120 ||
    narrative.length > 512 ||
    !title ||
    !narrative ||
    /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(title + narrative)
  )
    return failure("INVALID_INPUT");

  const combined = `${title} ${narrative}`;
  if (
    (combined.match(/\bcompra\b/giu)?.length ?? 0) >
      (contract.includes("chile_credit") ? 2 : 1) ||
    (/\bDébito\b/iu.test(combined) && /\bCrédito\b/iu.test(combined)) ||
    (combined.match(/\$/g)?.length ?? 0) > 1
  )
    return failure("AMBIGUOUS_INPUT");

  const chile = contract.startsWith("banco_chile_");
  const credit = contract.includes("credit");
  let amountText: string;
  let last4: string;
  let merchant: string;
  let observedDate: string;
  let localTime: string | null = null;
  if (chile) {
    if (
      title !== (credit ? "Compra con Tarjeta de Crédito" : "Cargo en Cuenta")
    )
      return failure("UNSUPPORTED_FORMAT");
    const instrument = credit ? "con Tarjeta de Crédito" : "con cargo a Cuenta";
    const match = new RegExp(
      `^Te informamos que se ha realizado una compra por \\$${amountPattern} ${instrument} \\*{4}(\\d{4}) en ${merchantPattern} el ${datePattern} (\\d{2}:\\d{2})\\.$`,
      "u",
    ).exec(narrative);
    if (!match) return failure("UNSUPPORTED_FORMAT");
    amountText = match[1]!;
    last4 = match[2]!;
    merchant = match[3]!;
    observedDate = match[4]!;
    localTime = match[5]!;
  } else {
    const titleMatch = new RegExp(
      `^Transacción por \\$${amountPattern}$`,
      "u",
    ).exec(title);
    const instrument = credit ? "Crédito" : "Débito";
    const mask = credit ? "(?:\\*{4})?" : "";
    const match = new RegExp(
      `^Se realizó una compra con tu Tarjeta de ${instrument} terminada en ${mask}(\\d{4}) en ${merchantPattern}, el ${datePattern}\\.?$`,
      "u",
    ).exec(narrative);
    if (!titleMatch || !match) return failure("UNSUPPORTED_FORMAT");
    amountText = titleMatch[1]!;
    last4 = match[1]!;
    merchant = match[2]!;
    observedDate = match[3]!;
  }
  const amount = Number(amountText.replaceAll(".", ""));
  const date = calendarDate(observedDate);
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !date ||
    !validMerchant(merchant) ||
    (localTime !== null &&
      (Number(localTime.slice(0, 2)) > 23 || Number(localTime.slice(3)) > 59))
  )
    return failure("INVALID_INPUT");

  const proposedFields = Object.freeze({
    label: merchant,
    amount,
    occurredAt: date,
    category: "",
    type: credit ? ("credit_card_purchase" as const) : ("debit" as const),
    direction: "outgoing" as const,
  });
  const evidence: PurchaseEvidence = Object.freeze({
    contract,
    extractionVersion: 1,
    sourceAuthentication: "unverified",
    currency: "CLP",
    amount,
    merchant,
    date,
    localTime,
    timezone: "unknown",
    instrument: Object.freeze({
      kind: chile && !credit ? "account" : "card",
      maskedLast4: `****${last4}`,
    }),
  });
  return Object.freeze({ ok: true, proposedFields, evidence });
}
