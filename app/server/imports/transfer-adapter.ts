import { validOccurredAt, type ReviewedFields } from "../domain/model.js";

export interface ExtractedSentTransferText {
  contract: "santander_sent_transfer_v1";
  title: string;
  dateNarrative: string;
  amountLabel: string;
  amountText: string;
}

export interface TransferEvidence {
  readonly contract: "santander_sent_transfer_v1";
  readonly extractionVersion: 1;
  readonly sourceAuthentication: "unverified";
  readonly currency: "CLP";
  readonly amount: number;
  readonly date: string;
  readonly timezone: "unknown";
}

export type TransferParseResult =
  | Readonly<{
      ok: true;
      proposedFields: Readonly<ReviewedFields>;
      evidence: TransferEvidence;
    }>
  | Readonly<{
      ok: false;
      code: "UNSUPPORTED_CONTRACT" | "UNSUPPORTED_FORMAT" | "INVALID_INPUT";
    }>;

function failure(
  code: Extract<TransferParseResult, { ok: false }>["code"],
): TransferParseResult {
  return Object.freeze({ ok: false, code });
}

/**
 * Exact, separately extracted fields of the approved sent-transfer contract.
 * Caller must decode/extract and reject conflicting fields. This adapter neither
 * parses message bodies nor authenticates bank origin; it retains no account or
 * counterparty fields. Received transfers have no approved extraction contract.
 */
export function parseSentTransferText(input: unknown): TransferParseResult {
  if (!input || typeof input !== "object") return failure("INVALID_INPUT");
  const value = input as Partial<ExtractedSentTransferText>;
  if (value.contract !== "santander_sent_transfer_v1")
    return failure("UNSUPPORTED_CONTRACT");
  const { title, dateNarrative, amountLabel, amountText } = value;
  if (
    typeof title !== "string" ||
    typeof dateNarrative !== "string" ||
    typeof amountLabel !== "string" ||
    typeof amountText !== "string" ||
    title.length > 120 ||
    dateNarrative.length > 160 ||
    amountLabel.length > 80 ||
    amountText.length > 40 ||
    /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(
      title + dateNarrative + amountLabel + amountText,
    )
  )
    return failure("INVALID_INPUT");
  if (
    title !== "Comprobante Transferencia de fondos" ||
    amountLabel !== "Monto transferido"
  )
    return failure("UNSUPPORTED_FORMAT");
  const dateMatch =
    /^Te enviamos el detalle de la transferencia realizada el (\d{2})\/(\d{2})\/(\d{4})\.$/u.exec(
      dateNarrative,
    );
  const amountMatch = /^\$ ?([1-9]\d{0,2}(?:\.\d{3})*)$/u.exec(amountText);
  if (!dateMatch || !amountMatch) return failure("UNSUPPORTED_FORMAT");
  const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  const amount = Number(amountMatch[1]!.replaceAll(".", ""));
  if (!validOccurredAt(date) || !Number.isSafeInteger(amount) || amount <= 0)
    return failure("INVALID_INPUT");
  const proposedFields = Object.freeze({
    label: "Transferencia bancaria",
    amount,
    occurredAt: date,
    category: "",
    type: "bank_transfer" as const,
    direction: "outgoing" as const,
  });
  const evidence: TransferEvidence = Object.freeze({
    contract: "santander_sent_transfer_v1",
    extractionVersion: 1,
    sourceAuthentication: "unverified",
    currency: "CLP",
    amount,
    date,
    timezone: "unknown",
  });
  return Object.freeze({ ok: true, proposedFields, evidence });
}
