import type { ReviewedFields } from "../domain/model.js";
import type { PurchaseEvidence } from "../imports/purchase-adapters.js";
import type { TransferEvidence } from "../imports/transfer-adapter.js";
export type Observations = PurchaseEvidence | TransferEvidence;
export interface FinancialEvidence {
  id: string;
  contract: string;
  provider: string;
  observations: Observations;
}
export interface Proposal {
  id: string;
  evidenceId: string;
  fields: ReviewedFields;
  expiresAt: number;
  version: 1;
  provider: string;
}
export interface FinancialRecord extends ReviewedFields {
  id: string;
  evidenceId: string;
  provider: string;
  approvedAt: number;
}
export interface Replay {
  state: "pending" | "approved";
  id: string;
}
export interface LedgerFilter {
  month?: string;
  provider?: string;
  type?: string;
  direction?: string;
  cursor?: string;
  limit?: number;
}
export interface LedgerPage {
  items: FinancialRecord[];
  next: string | null;
  totals: {
    count: number;
    incoming: number;
    outgoing: number;
    creditPurchases: number;
    unresolved: number;
    unresolvedCount: number;
  };
}
export interface FinancialRepository {
  transaction<T>(operation: () => T): T;
  isMember(user: string, workspace: string): boolean;
  sweep(cutoff: number, workspace?: string): number;
  replay(
    workspace: string,
    fingerprint: string,
    cutoff: number,
  ): Replay | undefined;
  insert(
    workspace: string,
    fingerprint: string,
    evidence: FinancialEvidence,
    proposal: Proposal,
    createdAt: number,
  ): void;
  pending(
    workspace: string,
    cutoff: number,
    cursor: string,
  ): { items: Proposal[]; next: string | null };
  proposal(workspace: string, id: string, cutoff: number): Proposal | undefined;
  evidence(workspace: string, id: string): FinancialEvidence | undefined;
  approved(workspace: string, proposalId: string): { id: string } | undefined;
  approve(
    workspace: string,
    proposal: Proposal,
    record: FinancialRecord,
    user: string,
    month: string,
  ): void;
  ignore(workspace: string, proposal: Proposal): void;
  ledger(workspace: string, filter: LedgerFilter): LedgerPage;
  record(workspace: string, id: string): FinancialRecord | undefined;
}
