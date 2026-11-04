import type {
  WorkspaceRepository,
  Invitation,
  Member,
} from "../../application/workspace-repository.js";
import type { Workspace, WorkspaceRole } from "../../domain/model.js";
import type { Store } from "./store.js";
export function workspaceRepository(db: Store): WorkspaceRepository {
  return {
    transaction: (operation) => db.transaction(operation)(),
    listForUser: (userId) =>
      db
        .prepare(
          "SELECT w.id,w.name,m.role FROM workspace w JOIN membership m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.created_at",
        )
        .all(userId) as Workspace[],
    role: (workspaceId, userId) =>
      (
        db
          .prepare(
            "SELECT role FROM membership WHERE workspace_id=? AND user_id=?",
          )
          .get(workspaceId, userId) as { role: WorkspaceRole } | undefined
      )?.role,
    create: (id, name, ownerId) => {
      db.prepare("INSERT INTO workspace(id,name,created_at) VALUES(?,?,?)").run(
        id,
        name,
        Date.now(),
      );
      db.prepare(
        "INSERT INTO membership(workspace_id,user_id,role) VALUES(?,?,?)",
      ).run(id, ownerId, "owner");
    },
    members: (workspaceId) =>
      db
        .prepare(
          "SELECT m.user_id AS userId,u.name,m.role FROM membership m JOIN user u ON u.id=m.user_id WHERE m.workspace_id=?",
        )
        .all(workspaceId) as Member[],
    addMember: (workspaceId, userId) => {
      db.prepare(
        "INSERT INTO membership(workspace_id,user_id,role) VALUES(?,?,?) ON CONFLICT DO NOTHING",
      ).run(workspaceId, userId, "member");
    },
    removeMember: (workspaceId, userId) => {
      db.prepare(
        "DELETE FROM membership WHERE workspace_id=? AND user_id=?",
      ).run(workspaceId, userId);
    },
    createInvitation: (i, actor) => {
      db.prepare(
        "INSERT INTO invitation(id,workspace_id,digest,created_by,expires_at) VALUES(?,?,?,?,?)",
      ).run(i.id, i.workspaceId, i.digest, actor, i.expiresAt);
    },
    findInvitation: (digest) =>
      db
        .prepare(
          "SELECT id,workspace_id AS workspaceId,digest,expires_at AS expiresAt,claimed_at AS claimedAt,consumed_at AS consumedAt FROM invitation WHERE digest=?",
        )
        .get(digest) as Invitation | undefined,
    consumeInvitation: (id) => {
      db.prepare("DELETE FROM invitation WHERE id=?").run(id);
    },
    claimInvitation: (id) =>
      db
        .prepare(
          "UPDATE invitation SET claimed_at=? WHERE id=? AND expires_at>? AND (claimed_at IS NULL OR claimed_at<?)",
        )
        .run(Date.now(), id, Date.now(), Date.now() - 300000).changes === 1,
    releaseInvitation: (id) => {
      db.prepare("UPDATE invitation SET claimed_at=NULL WHERE id=?").run(id);
    },
    revokeInvitation: (workspaceId, id) => {
      db.prepare("DELETE FROM invitation WHERE workspace_id=? AND id=?").run(
        workspaceId,
        id,
      );
    },
    ownerExists: () =>
      Boolean(
        db.prepare("SELECT 1 FROM membership WHERE role='owner' LIMIT 1").get(),
      ),
    acquireBootstrap: () =>
      db
        .prepare(
          "INSERT INTO bootstrap_lock(id,expires_at) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET expires_at=excluded.expires_at WHERE bootstrap_lock.expires_at<?",
        )
        .run(Date.now() + 300000, Date.now()).changes === 1,
    releaseBootstrap: () => {
      db.prepare("DELETE FROM bootstrap_lock WHERE id=1").run();
    },
  };
}
