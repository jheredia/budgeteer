import type { Workspace, WorkspaceRole } from "../domain/model.js";
export interface Invitation {
  id: string;
  workspaceId: string;
  digest: string;
  expiresAt: number;
  claimedAt: number | null;
  consumedAt: number | null;
}
export interface Member {
  userId: string;
  name: string;
  role: WorkspaceRole;
}
export interface WorkspaceRepository {
  transaction<T>(operation: () => T): T;
  listForUser(userId: string): Workspace[];
  role(workspaceId: string, userId: string): WorkspaceRole | undefined;
  create(id: string, name: string, ownerId: string): void;
  members(workspaceId: string): Member[];
  addMember(workspaceId: string, userId: string): void;
  removeMember(workspaceId: string, userId: string): void;
  createInvitation(invitation: Invitation, createdBy: string): void;
  findInvitation(digest: string): Invitation | undefined;
  consumeInvitation(id: string): void;
  claimInvitation(id: string): boolean;
  releaseInvitation(id: string): void;
  revokeInvitation(workspaceId: string, id: string): void;
  ownerExists(): boolean;
  acquireBootstrap(): boolean;
  releaseBootstrap(): void;
}
