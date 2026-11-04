import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { readConfig } from "../server/config.js";

test("configuration excludes repository paths including symlink aliases and treats storage as a prerequisite", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-config-"));
  const secret = randomBytes(32).toString("hex");
  try {
    await symlink(process.cwd(), path.join(directory, "alias"), "dir");
    assert.throws(
      () =>
        readConfig({
          BETTER_AUTH_SECRET: secret,
          BUDGETEER_DATA_DIRECTORY: path.join(directory, "alias", "private"),
        }),
      /OUTSIDE_REPOSITORY/,
    );
    assert.throws(
      () =>
        readConfig({
          BETTER_AUTH_SECRET: secret,
          BUDGETEER_DATA_DIRECTORY: directory,
          BUDGETEER_MODE: "shared-https",
          BUDGETEER_ORIGIN: "http://household.example",
        }),
      /SHARED_HTTPS/,
    );
    const config = readConfig({
      BETTER_AUTH_SECRET: secret,
      BUDGETEER_DATA_DIRECTORY: directory,
    });
    assert.equal(config.mode, "development-loopback");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
