import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AppError, type Actor } from "../domain/model.js";
import type {
  WorkspaceRepository,
  Invitation,
} from "./workspace-repository.js";
import type { AccountInput, AccountProvisioner } from "./accounts.js";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const validName = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim() || value.length > 100)
    throw new AppError(422, "INVALID_NAME");
  return value.trim();
};
export function workspaceServices(
  repository: WorkspaceRepository,
  accounts: AccountProvisioner,
) {
  function requireMember(actorId: string, workspaceId: string) {
    const role = repository.role(workspaceId, actorId);
    if (!role) throw new AppError(404, "NOT_FOUND");
    return role;
  }
  function requireOwner(actorId: string, workspaceId: string) {
    if (requireMember(actorId, workspaceId) !== "owner")
      throw new AppError(403, "OWNER_REQUIRED");
  }
  function validateInvitation(token: string): Invitation {
    if (typeof token !== "string" || token.length < 32 || token.length > 128)
      throw new AppError(422, "INVITATION_UNAVAILABLE");
    const invitation = repository.findInvitation(digest(token));
    if (!invitation || invitation.expiresAt <= Date.now())
      throw new AppError(422, "INVITATION_UNAVAILABLE");
    return invitation;
  }
  function create(actorId: string, name: string) {
    const id = randomUUID();
    repository.transaction(() =>
      repository.create(id, validName(name), actorId),
    );
    return { id, name: validName(name), role: "owner" as const };
  }
  return {
    requireMember,
    requireOwner,
    list: (actorId: string) => repository.listForUser(actorId),
    members: (actorId: string, workspaceId: string) => {
      requireMember(actorId, workspaceId);
      return repository.members(workspaceId);
    },
    create,
    async bootstrap(input: AccountInput, name: string) {
      const workspaceName = validName(name);
      validName(input.name);
      if (
        typeof input.email !== "string" ||
        !input.email.trim() ||
        input.email.length > 254 ||
        typeof input.password !== "string" ||
        input.password.length < 12 ||
        input.password.length > 128
      )
        throw new AppError(422, "INVALID_INPUT");
      if (repository.ownerExists() || !repository.acquireBootstrap())
        throw new AppError(409, "BOOTSTRAP_CLOSED");
      try {
        let account;
        try {
          account = await accounts.provisionAccount(input);
        } catch (error) {
          if (
            !(error instanceof AppError) ||
            error.code !== "ACCOUNT_ALREADY_EXISTS"
          )
            throw error;
          // A prior interrupted bootstrap may have saved credentials but not the workspace.
          // Recovery requires the actual password via the maintained library; no account takeover.
          account = await accounts.recoverBootstrapAccount(input);
        }
        return create(account.user.id, workspaceName);
      } finally {
        repository.releaseBootstrap();
      }
    },
    invite(actorId: string, workspaceId: string) {
      return repository.transaction(() => {
        requireOwner(actorId, workspaceId);
        const token = randomBytes(32).toString("base64url");
        const invitation: Invitation = {
          id: randomUUID(),
          workspaceId,
          digest: digest(token),
          expiresAt: Date.now() + 86400000,
          claimedAt: null,
          consumedAt: null,
        };
        repository.createInvitation(invitation, actorId);
        return { id: invitation.id, token, expiresAt: invitation.expiresAt };
      });
    },
    accept(actorId: string, token: string) {
      return repository.transaction(() => {
        const invitation = validateInvitation(token);
        if (invitation.claimedAt && invitation.claimedAt > Date.now() - 300000)
          throw new AppError(409, "INVITATION_UNAVAILABLE");
        repository.addMember(invitation.workspaceId, actorId);
        repository.consumeInvitation(invitation.id);
        return { workspaceId: invitation.workspaceId };
      });
    },
    async enroll(token: string, input: AccountInput) {
      const invitation = repository.transaction(() => {
        const found = validateInvitation(token);
        if (!repository.claimInvitation(found.id))
          throw new AppError(409, "INVITATION_UNAVAILABLE");
        return found;
      });
      try {
        const account = await accounts.provisionAccount(input);
        return repository.transaction(() => {
          const current = validateInvitation(token);
          repository.addMember(current.workspaceId, account.user.id);
          repository.consumeInvitation(current.id);
          return { workspaceId: current.workspaceId };
        });
      } finally {
        repository.releaseInvitation(invitation.id);
      }
    },
    remove(actorId: string, workspaceId: string, userId: string) {
      repository.transaction(() => {
        const role = requireMember(actorId, workspaceId);
        if (actorId !== userId && role !== "owner")
          throw new AppError(403, "OWNER_REQUIRED");
        if (repository.role(workspaceId, userId) === "owner")
          throw new AppError(409, "OWNER_CANNOT_LEAVE");
        repository.removeMember(workspaceId, userId);
      });
    },
    revoke(actorId: string, workspaceId: string, id: string) {
      repository.transaction(() => {
        requireOwner(actorId, workspaceId);
        repository.revokeInvitation(workspaceId, id);
      });
    },
  };
}
export type WorkspaceServices = ReturnType<typeof workspaceServices>;
