import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createAuthentication } from "../server/auth/authentication.js";
import {
  openStore,
  migrateApplication,
} from "../server/persistence/sqlite/store.js";

test("maintained auth blocks raw signup, hashes passwords, sets cookies and revokes logout", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-auth-"));
  const db = openStore(directory);
  try {
    const origin = "http://127.0.0.1:4174";
    const authentication = await createAuthentication(db, {
      origin,
      port: 4174,
      mode: "development-loopback",
      dataDirectory: directory,
      authSecret: randomBytes(32).toString("hex"),
    });
    migrateApplication(db);
    const credentials = {
      email: "synthetic-owner@example.test",
      name: "Usuario sintético",
      password: randomBytes(24).toString("base64url"),
    };
    const request = (route: string, body?: unknown, cookie?: string) =>
      new Request(origin + "/api/auth/" + route, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          origin,
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    const rejected = await authentication.auth.handler(
      request("sign-up/email", credentials),
    );
    // Better Auth intentionally returns a synthetic 200 on forbidden signup to avoid account enumeration.
    assert.equal(rejected.status, 200);
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS n FROM user").get() as { n: number }).n,
      0,
    );
    await authentication.provisionAccount(credentials);
    const account = db.prepare("SELECT password FROM account").get() as {
      password: string;
    };
    assert.ok(
      account.password && account.password !== credentials.password,
      "Password must be hashed",
    );
    const signedIn = await authentication.auth.handler(
      request("sign-in/email", credentials),
    );
    assert.equal(signedIn.status, 200);
    const cookies = signedIn.headers.getSetCookie();
    assert.ok(
      cookies.some((value) => /HttpOnly/i.test(value)),
      "Session cookie must be HttpOnly",
    );
    const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
    const actor = await authentication.resolveActor(new Headers({ cookie }));
    assert.equal(actor.email, credentials.email);
    const signedOut = await authentication.auth.handler(
      request("sign-out", {}, cookie),
    );
    assert.equal(signedOut.status, 200);
    await assert.rejects(
      authentication.resolveActor(new Headers({ cookie })),
      (error) => (error as { code: string }).code === "AUTHENTICATION_REQUIRED",
    );
  } finally {
    db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
