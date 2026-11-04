import Database from "better-sqlite3";
import { chmodSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
export function openStore(directory: string) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if ((statSync(directory).mode & 0o077) !== 0)
    throw new Error("PRIVATE_DATA_DIRECTORY_REQUIRED");
  const file = path.join(directory, "budgeteer.sqlite");
  const db = new Database(file);
  try {
    const exists = db
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='application_migration'",
      )
      .get();
    if (exists) {
      const row = db
        .prepare("SELECT MAX(version) AS version FROM application_migration")
        .get() as { version: number | null };
      if (row.version !== 1 && row.version !== 2)
        throw new Error("UNSUPPORTED_APPLICATION_SCHEMA");
    }
  } catch (error) {
    db.close();
    throw error;
  }
  chmodSync(file, 0o600);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  return db;
}
export type Store = ReturnType<typeof openStore>;
export function migrateApplication(db: Store) {
  db.transaction(() =>
    db.exec(`
    CREATE TABLE IF NOT EXISTS application_migration(version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS workspace(id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS membership(
      workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES user(id), role TEXT NOT NULL CHECK(role IN ('owner','member')),
      PRIMARY KEY(workspace_id,user_id));
    CREATE INDEX IF NOT EXISTS membership_user ON membership(user_id,workspace_id);
    CREATE TABLE IF NOT EXISTS invitation(
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
      digest TEXT NOT NULL UNIQUE, created_by TEXT NOT NULL REFERENCES user(id), expires_at INTEGER NOT NULL,
      claimed_at INTEGER, consumed_at INTEGER);
    CREATE TABLE IF NOT EXISTS app_session_activity(
      session_id TEXT PRIMARY KEY REFERENCES session(id) ON DELETE CASCADE, last_seen INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS bootstrap_lock(id INTEGER PRIMARY KEY CHECK(id=1), expires_at INTEGER NOT NULL);
    INSERT OR IGNORE INTO application_migration(version) VALUES(1);
  `),
  )();
  const version = (
    db
      .prepare("SELECT MAX(version) AS version FROM application_migration")
      .get() as { version: number }
  ).version;
  if (version === 1)
    db.transaction(() =>
      db.exec(`
    CREATE TABLE financial_evidence(
      workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
      id TEXT NOT NULL, contract TEXT NOT NULL, provider TEXT NOT NULL,
      observations TEXT NOT NULL, created_at INTEGER NOT NULL,
      PRIMARY KEY(workspace_id,id));
    CREATE TABLE financial_proposal(
      workspace_id TEXT NOT NULL, id TEXT NOT NULL, evidence_id TEXT NOT NULL,
      fields TEXT NOT NULL, expires_at INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1 CHECK(version=1),
      PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,evidence_id),
      FOREIGN KEY(workspace_id,evidence_id) REFERENCES financial_evidence(workspace_id,id) ON DELETE CASCADE);
    CREATE INDEX proposal_expiry ON financial_proposal(expires_at,workspace_id,id);
    CREATE INDEX proposal_workspace ON financial_proposal(workspace_id,id);
    CREATE TABLE financial_record(
      workspace_id TEXT NOT NULL, id TEXT NOT NULL, evidence_id TEXT NOT NULL,
      proposal_id TEXT NOT NULL, label TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0),
      occurred_at TEXT NOT NULL, month TEXT NOT NULL, category TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('debit','received_payment','credit_card_purchase','bank_transfer')),
      direction TEXT NOT NULL CHECK(direction IN ('incoming','outgoing','unresolved')),
      approved_by TEXT NOT NULL REFERENCES user(id), approved_at INTEGER NOT NULL,
      PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,proposal_id), UNIQUE(workspace_id,evidence_id),
      FOREIGN KEY(workspace_id,evidence_id) REFERENCES financial_evidence(workspace_id,id));
    CREATE INDEX record_chronology ON financial_record(workspace_id,occurred_at DESC,id DESC);
    CREATE INDEX record_filters ON financial_record(workspace_id,month,type,direction,occurred_at DESC,id DESC);
    CREATE INDEX evidence_provider ON financial_evidence(workspace_id,provider,id);
    CREATE TABLE financial_marker(
      workspace_id TEXT NOT NULL, fingerprint TEXT NOT NULL, evidence_id TEXT NOT NULL,
      PRIMARY KEY(workspace_id,fingerprint), UNIQUE(workspace_id,evidence_id),
      FOREIGN KEY(workspace_id,evidence_id) REFERENCES financial_evidence(workspace_id,id) ON DELETE CASCADE);
    INSERT INTO application_migration(version) VALUES(2);
  `),
    )();
  const violations = db.pragma("foreign_key_check") as unknown[];
  if (violations.length) throw new Error("INVALID_APPLICATION_REFERENCES");
}
