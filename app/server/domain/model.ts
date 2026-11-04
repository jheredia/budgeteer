export type WorkspaceRole = "owner" | "member";
export interface Actor {
  id: string;
  name: string;
  email: string;
}
export interface Workspace {
  id: string;
  name: string;
  role: WorkspaceRole;
}
export type NotificationType =
  "debit" | "received_payment" | "credit_card_purchase" | "bank_transfer";
export type Direction = "incoming" | "outgoing" | "unresolved";
export interface ReviewedFields {
  label: string;
  amount: number;
  occurredAt: string;
  category: string;
  type: NotificationType;
  direction: Direction;
}
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}
function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  return (
    year >= 1900 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
  );
}
export function validOccurredAt(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (validCalendarDate(value)) return true;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !validCalendarDate(value.slice(0, 10))
  )
    return false;
  return (
    Number(value.slice(11, 13)) < 24 &&
    Number(value.slice(14, 16)) < 60 &&
    Number(value.slice(17, 19)) < 60 &&
    Number.isFinite(Date.parse(value))
  );
}
export function monthOf(value: string): string {
  if (!validOccurredAt(value)) throw new AppError(422, "INVALID_DATE");
  if (value.length === 10) return value.slice(0, 7);
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Santiago",
  }).formatToParts(new Date(value));
  return (
    parts.find((part) => part.type === "year")!.value +
    "-" +
    parts.find((part) => part.type === "month")!.value
  );
}
export function validateReviewedFields(input: unknown): ReviewedFields {
  if (!input || typeof input !== "object")
    throw new AppError(422, "INVALID_RECORD");
  const value = input as Partial<ReviewedFields>;
  if (
    typeof value.label !== "string" ||
    !value.label.trim() ||
    value.label.length > 120 ||
    !Number.isSafeInteger(value.amount) ||
    value.amount! <= 0 ||
    !validOccurredAt(value.occurredAt) ||
    typeof value.category !== "string" ||
    value.category.length > 80 ||
    ![
      "debit",
      "received_payment",
      "credit_card_purchase",
      "bank_transfer",
    ].includes(String(value.type)) ||
    !["incoming", "outgoing", "unresolved"].includes(String(value.direction))
  )
    throw new AppError(422, "INVALID_RECORD");
  return {
    label: value.label.trim(),
    amount: value.amount!,
    occurredAt: value.occurredAt,
    category: value.category.trim(),
    type: value.type!,
    direction: value.direction!,
  };
}
