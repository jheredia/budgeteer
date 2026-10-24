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
      if (row.version !== 1) throw new Error("UNSUPPORTED_APPLICATION_SCHEMA");
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
}
