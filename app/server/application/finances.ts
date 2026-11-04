import { createHmac, randomUUID } from "node:crypto";
import {
  AppError,
  monthOf,
  validateReviewedFields,
  type ReviewedFields,
} from "../domain/model.js";
import type {
  FinancialRepository,
  LedgerFilter,
  Observations,
} from "./financial-repository.js";
export const pendingLifetime = 30 * 24 * 60 * 60 * 1000;
export function financialServices(
  repository: FinancialRepository,
  secret: string,
  now = Date.now,
) {
  const authorize = (user: string, workspace: string) => {
    if (!repository.isMember(user, workspace))
      throw new AppError(404, "NOT_FOUND");
  };
  const purge = (workspace?: string) =>
    repository.transaction(() => repository.sweep(now(), workspace));
  const fingerprint = (workspace: string, raw: Buffer) =>
    createHmac("sha256", secret)
      .update(workspace)
      .update("\0")
      .update(raw)
      .digest("hex");
  const findProposal = (workspace: string, id: string) => {
    const row = repository.proposal(workspace, id, now());
    if (!row) throw new AppError(404, "NOT_FOUND");
    return row;
  };
  const findEvidence = (workspace: string, id: string) => {
    const row = repository.evidence(workspace, id);
    if (!row) throw new AppError(404, "NOT_FOUND");
    return row;
  };
  return {
    authorize,
    sweep: () => purge(),
    replay(user: string, workspace: string, raw: Buffer) {
      const digest = fingerprint(workspace, raw);
      return repository.transaction(() => {
        authorize(user, workspace);
        repository.sweep(now(), workspace);
        return repository.replay(workspace, digest, now());
      });
    },
    import(
      user: string,
      workspace: string,
      raw: Buffer,
      decoded: { proposedFields: ReviewedFields; evidence: Observations },
    ) {
      // Fingerprinting and validation happen before acquiring a write lock.
      const digest = fingerprint(workspace, raw),
        fields = validateReviewedFields(decoded.proposedFields);
      return repository.transaction(() => {
        authorize(user, workspace);
        repository.sweep(now(), workspace);
        const found = repository.replay(workspace, digest, now());
        if (found) return { ...found, replayed: true };
        const id = randomUUID(),
          eid = randomUUID(),
          provider = decoded.evidence.contract.startsWith("banco_chile")
            ? "banco_chile"
            : "santander";
        repository.insert(
          workspace,
          digest,
          {
            id: eid,
            contract: decoded.evidence.contract,
            provider,
            observations: decoded.evidence,
          },
          {
            id,
            evidenceId: eid,
            fields,
            provider,
            expiresAt: now() + pendingLifetime,
            version: 1,
          },
          now(),
        );
        return { state: "pending" as const, id, replayed: false };
      });
    },
    pending(user: string, workspace: string, cursor = "") {
      authorize(user, workspace);
      purge(workspace);
      return repository.pending(workspace, now(), cursor);
    },
    proposal(user: string, workspace: string, id: string) {
      authorize(user, workspace);
      purge(workspace);
      const row = findProposal(workspace, id);
      return { ...row, evidence: findEvidence(workspace, row.evidenceId) };
    },
    approve(
      user: string,
      workspace: string,
      id: string,
      input: unknown,
      version: unknown = 1,
    ) {
      const fields = validateReviewedFields(input);
      if (fields.occurredAt.length !== 10)
        throw new AppError(422, "DATE_ONLY_REQUIRED");
      return repository.transaction(() => {
        authorize(user, workspace);
        repository.sweep(now(), workspace);
        const prior = repository.approved(workspace, id);
        if (prior) return prior;
        const proposal = findProposal(workspace, id);
        if (version !== 1) throw new AppError(409, "VERSION_CONFLICT");
        const record = {
          ...fields,
          id: randomUUID(),
          evidenceId: proposal.evidenceId,
          provider: proposal.provider,
          approvedAt: now(),
        };
        repository.approve(
          workspace,
          proposal,
          record,
          user,
          monthOf(fields.occurredAt),
        );
        return { id: record.id };
      });
    },
    ignore(user: string, workspace: string, id: string) {
      return repository.transaction(() => {
        authorize(user, workspace);
        repository.sweep(now(), workspace);
        repository.ignore(workspace, findProposal(workspace, id));
        return { ok: true };
      });
    },
    ledger(user: string, workspace: string, filter: LedgerFilter = {}) {
      authorize(user, workspace);
      if (
        (filter.month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(filter.month)) ||
        (filter.provider &&
          !["banco_chile", "santander"].includes(filter.provider)) ||
        (filter.type &&
          ![
            "debit",
            "received_payment",
            "credit_card_purchase",
            "bank_transfer",
          ].includes(filter.type)) ||
        (filter.direction &&
          !["incoming", "outgoing", "unresolved"].includes(filter.direction)) ||
        !Number.isInteger(filter.limit ?? 20) ||
        (filter.limit ?? 20) < 1 ||
        (filter.limit ?? 20) > 50
      )
        throw new AppError(422, "INVALID_FILTER");
      return repository.ledger(workspace, filter);
    },
    record(user: string, workspace: string, id: string) {
      authorize(user, workspace);
      const row = repository.record(workspace, id);
      if (!row) throw new AppError(404, "NOT_FOUND");
      return { ...row, evidence: findEvidence(workspace, row.evidenceId) };
    },
  };
}
export type FinancialServices = ReturnType<typeof financialServices>;
