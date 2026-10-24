import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import Database from "better-sqlite3";
import { createApp } from "../server/http/app.js";

test("invalid bootstrap leaves no account; interrupted bootstrap recovers only with its real password", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-bootstrap-"));
  const config = {
    mode: "development-loopback" as const,
    origin: "http://127.0.0.1:4174",
    port: 4174,
    dataDirectory: directory,
    authSecret: randomBytes(32).toString("hex"),
  };
  const system = await createApp(config);
  const input = {
    email: "synthetic-bootstrap@example.test",
    name: "Persona sintética",
    password: randomBytes(24).toString("base64url"),
  };
  try {
    await assert.rejects(system.workspaces.bootstrap(input, ""));
    const inspection = new Database(path.join(directory, "budgeteer.sqlite"), {
      readonly: true,
    });
    assert.equal(
      (
        inspection.prepare("SELECT COUNT(*) AS n FROM user").get() as {
          n: number;
        }
      ).n,
      0,
    );
    inspection.close();
    // Simulate a process interruption after credential creation and before workspace commit.
    await system.authentication.provisionAccount(input);
    await assert.rejects(
      system.workspaces.bootstrap(
        { ...input, password: randomBytes(24).toString("base64url") },
        "Compartido",
      ),
    );
    const result = await system.workspaces.bootstrap(input, "Compartido");
    assert.equal(result.role, "owner");
    assert.equal(
      system.workspaces.list(
        (await system.authentication.recoverBootstrapAccount(input)).user.id,
      ).length,
      1,
    );
  } finally {
    await system.app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("future application schema is rejected before auth migrations mutate the store", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-future-"));
  const file = path.join(directory, "budgeteer.sqlite");
  const db = new Database(file);
  db.exec(
    "CREATE TABLE application_migration(version INTEGER PRIMARY KEY);INSERT INTO application_migration VALUES(999)",
  );
  db.close();
  try {
    await assert.rejects(
      createApp({
        mode: "development-loopback",
        origin: "http://127.0.0.1:4174",
        port: 4174,
        dataDirectory: directory,
        authSecret: randomBytes(32).toString("hex"),
      }),
      /UNSUPPORTED_APPLICATION_SCHEMA/,
    );
    const inspection = new Database(file, { readonly: true });
    assert.equal(
      (
        inspection
          .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='user'")
          .get() as { n: number }
      ).n,
      0,
    );
    inspection.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
