import type { Store } from "./store.js";
import type {
  FinancialRepository,
  FinancialEvidence,
  FinancialRecord,
  Proposal,
  LedgerPage,
} from "../../application/financial-repository.js";
import { AppError } from "../../domain/model.js";
interface ProposalRow {
  id: string;
  evidence_id: string;
  fields: string;
  expires_at: number;
  provider: string;
}
interface RecordRow {
  id: string;
  evidence_id: string;
  label: string;
  amount: number;
  occurred_at: string;
  category: string;
  type: FinancialRecord["type"];
  direction: FinancialRecord["direction"];
  provider: string;
  approved_at: number;
}
const proposalDto = (r: ProposalRow): Proposal => ({
  id: r.id,
  evidenceId: r.evidence_id,
  fields: JSON.parse(r.fields),
  expiresAt: r.expires_at,
  version: 1,
  provider: r.provider,
});
const recordDto = (r: RecordRow): FinancialRecord => ({
  id: r.id,
  evidenceId: r.evidence_id,
  label: r.label,
  amount: r.amount,
  occurredAt: r.occurred_at,
  category: r.category,
  type: r.type,
  direction: r.direction,
  provider: r.provider,
  approvedAt: r.approved_at,
});
export function financialRepository(db: Store): FinancialRepository {
  const proposalSelect =
    "SELECT p.*,e.provider FROM financial_proposal p JOIN financial_evidence e ON e.workspace_id=p.workspace_id AND e.id=p.evidence_id";
  const recordSelect =
    "SELECT r.*,e.provider FROM financial_record r JOIN financial_evidence e ON e.workspace_id=r.workspace_id AND e.id=r.evidence_id";
  function remove(workspace: string, id: string, eid: string) {
    db.prepare(
      "DELETE FROM financial_proposal WHERE workspace_id=? AND id=?",
    ).run(workspace, id);
    db.prepare(
      "DELETE FROM financial_evidence WHERE workspace_id=? AND id=? AND NOT EXISTS(SELECT 1 FROM financial_record WHERE workspace_id=? AND evidence_id=?)",
    ).run(workspace, eid, workspace, eid);
  }
  return {
    transaction: (operation) => db.transaction(operation)(),
    isMember: (user, workspace) =>
      Boolean(
        db
          .prepare(
            "SELECT 1 FROM membership WHERE workspace_id=? AND user_id=?",
          )
          .get(workspace, user),
      ),
    sweep(cutoff, workspace) {
      const rows = db
        .prepare(
          `SELECT workspace_id,id,evidence_id FROM financial_proposal WHERE expires_at<=? ${workspace ? "AND workspace_id=?" : ""} LIMIT 100`,
        )
        .all(...(workspace ? [cutoff, workspace] : [cutoff])) as {
        workspace_id: string;
        id: string;
        evidence_id: string;
      }[];
      for (const r of rows) remove(r.workspace_id, r.id, r.evidence_id);
      return rows.length;
    },
    replay(workspace, fingerprint, cutoff) {
      const row = db
        .prepare(
          "SELECT evidence_id FROM financial_marker WHERE workspace_id=? AND fingerprint=?",
        )
        .get(workspace, fingerprint) as { evidence_id: string } | undefined;
      if (!row) return;
      const record = db
        .prepare(
          "SELECT id FROM financial_record WHERE workspace_id=? AND evidence_id=?",
        )
        .get(workspace, row.evidence_id) as { id: string } | undefined;
      if (record) return { state: "approved", id: record.id };
      const proposal = db
        .prepare(
          "SELECT id FROM financial_proposal WHERE workspace_id=? AND evidence_id=? AND expires_at>?",
        )
        .get(workspace, row.evidence_id, cutoff) as { id: string } | undefined;
      if (proposal) return { state: "pending", id: proposal.id };
      // The specific replay target may be beyond this sweep's bounded batch.
      const expired = db
        .prepare(
          "SELECT id FROM financial_proposal WHERE workspace_id=? AND evidence_id=? AND expires_at<=?",
        )
        .get(workspace, row.evidence_id, cutoff) as { id: string } | undefined;
      if (expired) remove(workspace, expired.id, row.evidence_id);
    },
    insert(workspace, fingerprint, e, p, createdAt) {
      db.prepare("INSERT INTO financial_evidence VALUES(?,?,?,?,?,?)").run(
        workspace,
        e.id,
        e.contract,
        e.provider,
        JSON.stringify(e.observations),
        createdAt,
      );
      db.prepare(
        "INSERT INTO financial_proposal(workspace_id,id,evidence_id,fields,expires_at) VALUES(?,?,?,?,?)",
      ).run(
        workspace,
        p.id,
        p.evidenceId,
        JSON.stringify(p.fields),
        p.expiresAt,
      );
      db.prepare("INSERT INTO financial_marker VALUES(?,?,?)").run(
        workspace,
        fingerprint,
        e.id,
      );
    },
    pending(workspace, cutoff, cursor) {
      const rows = db
        .prepare(
          `${proposalSelect} WHERE p.workspace_id=? AND p.expires_at>? AND p.id>? ORDER BY p.id LIMIT 21`,
        )
        .all(workspace, cutoff, cursor) as ProposalRow[];
      return {
        items: rows.slice(0, 20).map(proposalDto),
        next: rows.length > 20 ? rows[19]!.id : null,
      };
    },
    proposal(workspace, id, cutoff) {
      const row = db
        .prepare(
          `${proposalSelect} WHERE p.workspace_id=? AND p.id=? AND p.expires_at>?`,
        )
        .get(workspace, id, cutoff) as ProposalRow | undefined;
      return row ? proposalDto(row) : undefined;
    },
    evidence(workspace, id) {
      const row = db
        .prepare(
          "SELECT id,contract,provider,observations FROM financial_evidence WHERE workspace_id=? AND id=?",
        )
        .get(workspace, id) as
        | {
            id: string;
            contract: string;
            provider: string;
            observations: string;
          }
        | undefined;
      return row
        ? ({
            ...row,
            observations: JSON.parse(row.observations),
          } as FinancialEvidence)
        : undefined;
    },
    approved: (workspace, id) =>
      db
        .prepare(
          "SELECT id FROM financial_record WHERE workspace_id=? AND proposal_id=?",
        )
        .get(workspace, id) as { id: string } | undefined,
    approve(workspace, p, r, user, month) {
      db.prepare(
        "INSERT INTO financial_record VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        workspace,
        r.id,
        p.evidenceId,
        p.id,
        r.label,
        r.amount,
        r.occurredAt,
        month,
        r.category,
        r.type,
        r.direction,
        user,
        r.approvedAt,
      );
      db.prepare(
        "DELETE FROM financial_proposal WHERE workspace_id=? AND id=?",
      ).run(workspace, p.id);
    },
    ignore: (workspace, p) => remove(workspace, p.id, p.evidenceId),
    ledger(workspace, filter) {
      const where = ["r.workspace_id=?"],
        params: unknown[] = [workspace];
      for (const [key, column] of [
        ["month", "r.month"],
        ["provider", "e.provider"],
        ["type", "r.type"],
        ["direction", "r.direction"],
      ] as const)
        if (filter[key]) {
          where.push(`${column}=?`);
          params.push(filter[key]);
        }
      const base = `FROM financial_record r JOIN financial_evidence e ON e.workspace_id=r.workspace_id AND e.id=r.evidence_id WHERE ${where.join(" AND ")}`;
      let totals: Record<string, bigint>;
      try {
        totals = db
          .prepare(
            `SELECT COUNT(*) count,COALESCE(SUM(CASE WHEN direction='incoming' AND type!='credit_card_purchase' THEN amount ELSE 0 END),0) incoming,COALESCE(SUM(CASE WHEN direction='outgoing' AND type!='credit_card_purchase' THEN amount ELSE 0 END),0) outgoing,COALESCE(SUM(CASE WHEN type='credit_card_purchase' AND direction!='unresolved' THEN amount ELSE 0 END),0) creditPurchases,COALESCE(SUM(CASE WHEN direction='unresolved' THEN amount ELSE 0 END),0) unresolved,COUNT(CASE WHEN direction='unresolved' THEN 1 END) unresolvedCount ${base}`,
          )
          .safeIntegers(true)
          .get(...params) as Record<string, bigint>;
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "SQLITE_ERROR" &&
          error.message === "integer overflow"
        )
          throw new AppError(422, "TOTAL_OVERFLOW");
        throw error;
      }
      const safe: Record<string, number> = {};
      for (const key of Object.keys(totals)) {
        if (totals[key]! > BigInt(Number.MAX_SAFE_INTEGER))
          throw new AppError(422, "TOTAL_OVERFLOW");
        safe[key] = Number(totals[key]);
      }
      let cursor = "";
      const values = [...params];
      if (filter.cursor) {
        let decoded: unknown;
        try {
          decoded = JSON.parse(
            Buffer.from(filter.cursor, "base64url").toString(),
          );
        } catch {
          throw new AppError(422, "INVALID_FILTER");
        }
        if (
          !Array.isArray(decoded) ||
          decoded.length !== 2 ||
          decoded.some((v) => typeof v !== "string" || v.length > 128)
        )
          throw new AppError(422, "INVALID_FILTER");
        cursor = " AND (r.occurred_at<? OR (r.occurred_at=? AND r.id<?))";
        values.push(decoded[0], decoded[0], decoded[1]);
      }
      const limit = filter.limit ?? 20,
        rows = db
          .prepare(
            `SELECT r.*,e.provider ${base}${cursor} ORDER BY r.occurred_at DESC,r.id DESC LIMIT ?`,
          )
          .all(...values, limit + 1) as RecordRow[],
        last = rows[limit - 1];
      return {
        items: rows.slice(0, limit).map(recordDto),
        totals: safe as LedgerPage["totals"],
        next:
          rows.length > limit
            ? Buffer.from(
                JSON.stringify([last!.occurred_at, last!.id]),
              ).toString("base64url")
            : null,
      };
    },
    record(workspace, id) {
      const row = db
        .prepare(`${recordSelect} WHERE r.workspace_id=? AND r.id=?`)
        .get(workspace, id) as RecordRow | undefined;
      return row ? recordDto(row) : undefined;
    },
  };
}
