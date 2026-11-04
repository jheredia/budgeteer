import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthOf,
  validOccurredAt,
  validateReviewedFields,
} from "../server/domain/model.js";
test("date-only and offset timestamps retain correct Santiago month and reject normalized impossible dates", () => {
  assert.equal(monthOf("2026-10-01"), "2026-10");
  assert.equal(monthOf("2026-10-01T02:00:00Z"), "2026-09");
  assert.equal(validOccurredAt("2026-02-30"), false);
  assert.equal(validOccurredAt("2026-02-30T12:00:00Z"), false);
  assert.equal(validOccurredAt("10/01/2026"), false);
  assert.equal(validOccurredAt("2026-10-01T12:00:00"), false);
  const result = validateReviewedFields({
    label: "Ejemplo sintético",
    amount: 1,
    occurredAt: "2026-10-01",
    category: "Otra",
    type: "debit",
    direction: "outgoing",
    rawBody: "never persisted",
  });
  assert.equal("rawBody" in result, false);
});
