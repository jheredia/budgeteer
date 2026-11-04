import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createApp } from "../server/http/app.js";
import { openStore } from "../server/persistence/sqlite/store.js";
import { financialRepository } from "../server/persistence/sqlite/finances.js";
import {
  financialServices,
  pendingLifetime,
} from "../server/application/finances.js";
import { syntheticMime, importContracts } from "../server/imports/synthetic.js";
import { decodeMime } from "../server/imports/decode.js";

test("HTTP import/review/ignore/replay/restart, shared members, isolation, filters and exact totals", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-financial-"));
  const config = {
    mode: "development-loopback" as const,
    origin: "http://127.0.0.1:4174",
    port: 4174,
    dataDirectory: directory,
    authSecret: randomBytes(32).toString("hex"),
  };
  let system = await createApp(config);
  const credentials = (role: string) => ({
    email: `synthetic-${role}@example.test`,
    name: `Sintético ${role}`,
    password: randomBytes(24).toString("base64url"),
  });
  const owner = credentials("owner"),
    member = credentials("member"),
    other = credentials("other");
  const h = (cookie = "", type = "application/json") => ({
    host: "127.0.0.1:4174",
    origin: config.origin,
    "content-type": type,
    cookie,
  });
  const login = async (input: typeof owner) => {
    const r = await system.app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: h(),
      payload: input,
    });
    assert.equal(r.statusCode, 200);
    return r.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  };
  try {
    const workspace = await system.workspaces.bootstrap(
      owner,
      "Verificación sintética",
    );
    const ownerCookie = await login(owner);
    const ownerId = (
      await system.app.inject({ url: "/api/session", headers: h(ownerCookie) })
    ).json().user.id;
    const invite = system.workspaces.invite(ownerId, workspace.id);
    await system.workspaces.enroll(invite.token, member);
    const memberCookie = await login(member);
    await system.authentication.provisionAccount(other);
    const otherCookie = await login(other);
    const memberId = (
      await system.app.inject({ url: "/api/session", headers: h(memberCookie) })
    ).json().user.id;
    const base = `/api/workspaces/${workspace.id}`;
    const raw = Buffer.from(syntheticMime(importContracts[0]));
    const upload = async (
      cookie: string,
      bytes = raw,
      contract: string = importContracts[0],
      suffix = base,
    ) =>
      system.app.inject({
        method: "POST",
        url: `${suffix}/imports?contract=${contract}`,
        headers: {
          ...h(cookie, "application/octet-stream"),
          "x-budgeteer-synthetic": "yes",
        },
        payload: bytes,
      });
    assert.equal((await upload(otherCookie)).statusCode, 404);
    assert.equal((await upload("")).statusCode, 401);
    const first = await upload(ownerCookie);
    assert.equal(first.statusCode, 200, first.body);
    const pending = first.json();
    assert.equal((await upload(memberCookie)).json().id, pending.id);
    const proposal = (
      await system.app.inject({
        url: `${base}/proposals/${pending.id}`,
        headers: h(memberCookie),
      })
    ).json();
    assert.equal(proposal.fields.amount, 12500);
    assert.equal(proposal.evidence.observations.amount, 12500);
    const fields = {
      ...proposal.fields,
      amount: 14000,
      label: "Compra revisada",
      category: "Hogar",
    };
    const lock = openStore(directory);
    lock.exec("BEGIN IMMEDIATE");
    try {
      const unavailable = await system.app.inject({
        method: "POST",
        url: `${base}/proposals/${pending.id}/approve`,
        headers: h(memberCookie),
        payload: { fields, expectedVersion: 1 },
      });
      assert.equal(unavailable.statusCode, 503, unavailable.body);
      assert.equal(unavailable.json().code, "STORE_UNAVAILABLE");
      assert.equal(unavailable.headers["retry-after"], "1");
    } finally {
      lock.exec("ROLLBACK");
      lock.close();
    }
    assert.equal(system.finances.ledger(ownerId, workspace.id).totals.count, 0);
    assert.equal(
      system.finances.pending(ownerId, workspace.id).items.length,
      1,
    );
    const approve = () =>
      system.app.inject({
        method: "POST",
        url: `${base}/proposals/${pending.id}/approve`,
        headers: h(memberCookie),
        payload: { fields, expectedVersion: 1 },
      });
    const [a, b] = await Promise.all([approve(), approve()]);
    assert.equal(a.statusCode, 200, a.body);
    assert.equal(a.json().id, b.json().id);
    const recordId = a.json().id;
    assert.equal((await upload(ownerCookie)).json().id, recordId);
    const detail = (
      await system.app.inject({
        url: `${base}/ledger/${recordId}`,
        headers: h(ownerCookie),
      })
    ).json();
    assert.equal(detail.amount, 14000);
    assert.equal(detail.evidence.observations.amount, 12500);
    assert.equal(detail.evidence.observations.timezone, "unknown");
    for (const c of importContracts.slice(1)) {
      const imported = await upload(
        ownerCookie,
        Buffer.from(syntheticMime(c)),
        c,
      );
      assert.equal(imported.statusCode, 200, imported.body);
      const p = (
        await system.app.inject({
          url: `${base}/proposals/${imported.json().id}`,
          headers: h(ownerCookie),
        })
      ).json();
      const response = await system.app.inject({
        method: "POST",
        url: `${base}/proposals/${p.id}/approve`,
        headers: h(ownerCookie),
        payload: { fields: p.fields },
      });
      assert.equal(response.statusCode, 200, response.body);
    }
    const ledger = (
      await system.app.inject({
        url: `${base}/ledger?limit=2`,
        headers: h(memberCookie),
      })
    ).json();
    assert.equal(ledger.items.length, 2);
    assert.equal(ledger.totals.count, 5);
    assert.equal(ledger.totals.outgoing, 49500);
    assert.equal(ledger.totals.creditPurchases, 25000);
    assert.equal(ledger.totals.unresolvedCount, 0);
    assert.ok(ledger.next);
    const next = (
      await system.app.inject({
        url: `${base}/ledger?limit=2&cursor=${ledger.next}`,
        headers: h(memberCookie),
      })
    ).json();
    assert.equal(next.items.length, 2);
    assert.ok(
      !next.items.some((i: { id: string }) =>
        ledger.items.some((j: { id: string }) => j.id === i.id),
      ),
    );
    assert.deepEqual(next.totals, ledger.totals);
    const filtered = (
      await system.app.inject({
        url: `${base}/ledger?provider=banco_chile&type=credit_card_purchase&month=2026-11&direction=outgoing`,
        headers: h(ownerCookie),
      })
    ).json();
    assert.equal(filtered.totals.count, 1);
    assert.equal(filtered.totals.outgoing, 0);
    assert.equal(filtered.totals.creditPurchases, 12500);
    const second = system.workspaces.create(ownerId, "Segundo sintético");
    const separate = (
      await upload(
        ownerCookie,
        raw,
        importContracts[0],
        `/api/workspaces/${second.id}`,
      )
    ).json();
    assert.notEqual(separate.id, pending.id);
    assert.equal(
      (
        await system.app.inject({
          url: `/api/workspaces/${second.id}/ledger/${recordId}`,
          headers: h(ownerCookie),
        })
      ).statusCode,
      404,
    );
    assert.equal(
      (
        await system.app.inject({
          method: "POST",
          url: `/api/workspaces/${second.id}/proposals/${pending.id}/approve`,
          headers: h(ownerCookie),
          payload: { fields },
        })
      ).statusCode,
      404,
    );
    const ignored = await system.app.inject({
      method: "DELETE",
      url: `/api/workspaces/${second.id}/proposals/${separate.id}`,
      headers: h(ownerCookie),
      payload: {},
    });
    assert.equal(ignored.statusCode, 200);
    const fresh = (
      await upload(
        ownerCookie,
        raw,
        importContracts[0],
        `/api/workspaces/${second.id}`,
      )
    ).json();
    assert.notEqual(fresh.id, separate.id);
    await system.app.close();
    system = await createApp(config);
    assert.equal((await upload(memberCookie)).json().id, recordId);
    assert.equal(
      (
        await system.app.inject({
          url: `${base}/ledger`,
          headers: h(memberCookie),
        })
      ).json().totals.count,
      5,
    );
    system.workspaces.remove(ownerId, workspace.id, memberId);
    for (const url of [
      `${base}/ledger`,
      `${base}/ledger/${recordId}`,
      `${base}/proposals`,
      `${base}/proposals/${pending.id}`,
    ])
      assert.equal(
        (await system.app.inject({ url, headers: h(memberCookie) })).statusCode,
        404,
      );
    const oversized = await upload(ownerCookie, Buffer.alloc(1048577));
    assert.equal(oversized.statusCode, 413);
    assert.equal((await upload(ownerCookie)).statusCode, 200);
    const foreign = await system.app.inject({
      method: "POST",
      url: `${base}/imports?contract=${importContracts[0]}`,
      headers: {
        ...h(ownerCookie, "application/octet-stream"),
        origin: "https://invalid.test",
        "x-budgeteer-synthetic": "yes",
      },
      payload: raw,
    });
    assert.equal(foreign.statusCode, 403);
    assert.equal(
      (
        await system.app.inject({
          method: "POST",
          url: `${base}/imports?contract=${importContracts[0]}`,
          headers: h(ownerCookie, "application/octet-stream"),
          payload: raw,
        })
      ).statusCode,
      422,
    );
  } finally {
    await system.app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("repository rollback, migration, expiry cleanup, membership race, scoped FK and overflow/date-only policies", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "budgeteer-financial-repository-"),
  );
  const secret = randomBytes(32).toString("hex");
  const system = await createApp({
    mode: "development-loopback",
    origin: "http://127.0.0.1:4174",
    port: 4174,
    dataDirectory: directory,
    authSecret: secret,
  });
  const input = {
    email: "synthetic-repo@example.test",
    name: "Repositorio sintético",
    password: randomBytes(24).toString("base64url"),
  };
  const workspace = await system.workspaces.bootstrap(input, "Repositorio");
  const db = openStore(directory);
  const user = (
    db
      .prepare("SELECT user_id FROM membership WHERE workspace_id=?")
      .get(workspace.id) as { user_id: string }
  ).user_id;
  const raw = Buffer.from(syntheticMime(importContracts[0])),
    decoded = await decodeMime(raw, importContracts[0]);
  let clock = Date.now();
  const repo = financialRepository(db),
    service = financialServices(repo, secret, () => clock);
  try {
    assert.equal(
      (
        db
          .prepare("SELECT MAX(version) version FROM application_migration")
          .get() as { version: number }
      ).version,
      2,
    );
    const imported = service.import(user, workspace.id, raw, decoded),
      proposal = service.proposal(user, workspace.id, imported.id);
    db.exec(
      "CREATE TRIGGER fail_approval BEFORE DELETE ON financial_proposal BEGIN SELECT RAISE(ABORT,'SYNTHETIC_ROLLBACK'); END;",
    );
    assert.throws(
      () => service.approve(user, workspace.id, proposal.id, proposal.fields),
      /SYNTHETIC_ROLLBACK/,
    );
    assert.equal(service.ledger(user, workspace.id).totals.count, 0);
    assert.equal(service.pending(user, workspace.id).items.length, 1);
    db.exec("DROP TRIGGER fail_approval;");
    assert.throws(
      () =>
        service.approve(user, workspace.id, proposal.id, {
          ...proposal.fields,
          occurredAt: "2026-11-04T12:00:00Z",
        }),
      /DATE_ONLY_REQUIRED/,
    );
    assert.throws(
      () =>
        service.approve(user, workspace.id, proposal.id, proposal.fields, 2),
      /VERSION_CONFLICT/,
    );
    clock += pendingLifetime + 1;
    assert.equal(service.pending(user, workspace.id).items.length, 0);
    for (const table of [
      "financial_proposal",
      "financial_marker",
      "financial_evidence",
    ])
      assert.equal(
        (db.prepare(`SELECT COUNT(*) n FROM ${table}`).get() as { n: number })
          .n,
        0,
      );
    const fresh = service.import(user, workspace.id, raw, decoded);
    assert.notEqual(fresh.id, imported.id);
    // Parsing completed while membership was valid; mutation rechecks after removal.
    db.prepare("DELETE FROM membership WHERE workspace_id=? AND user_id=?").run(
      workspace.id,
      user,
    );
    assert.throws(
      () =>
        service.import(
          user,
          workspace.id,
          Buffer.concat([raw, Buffer.from("\n")]),
          decoded,
        ),
      /NOT_FOUND/,
    );
    assert.throws(
      () =>
        service.approve(user, workspace.id, fresh.id, decoded.proposedFields),
      /NOT_FOUND/,
    );
    assert.throws(
      () => service.ignore(user, workspace.id, fresh.id),
      /NOT_FOUND/,
    );
    db.prepare("INSERT INTO membership VALUES(?,?,?)").run(
      workspace.id,
      user,
      "owner",
    );
    const second = system.workspaces.create(user, "Otro repositorio");
    assert.throws(
      () =>
        db
          .prepare("INSERT INTO financial_marker VALUES(?,?,?)")
          .run(
            second.id,
            "synthetic-marker",
            service.proposal(user, workspace.id, fresh.id).evidence.id,
          ),
      /FOREIGN KEY/,
    );
    const p = service.proposal(user, workspace.id, fresh.id);
    service.approve(user, workspace.id, p.id, {
      ...p.fields,
      amount: Number.MAX_SAFE_INTEGER,
      direction: "unresolved",
    });
    assert.equal(service.ledger(user, workspace.id).totals.unresolvedCount, 1);
    const extra = service.import(
      user,
      workspace.id,
      Buffer.concat([raw, Buffer.from("\n")]),
      decoded,
    );
    service.approve(user, workspace.id, extra.id, {
      ...decoded.proposedFields,
      amount: 1,
      direction: "unresolved",
    });
    assert.throws(() => service.ledger(user, workspace.id), /TOTAL_OVERFLOW/);
    const expiryWorkspace = system.workspaces.create(
        user,
        "Vencimiento acotado",
      ),
      inputs = new Map<string, Buffer>();
    for (let index = 0; index < 101; index++) {
      const bytes = Buffer.concat([raw, Buffer.from(`\nsynthetic-${index}`)]),
        p = service.import(user, expiryWorkspace.id, bytes, decoded);
      inputs.set(p.id, bytes);
    }
    const target = (
        db
          .prepare(
            "SELECT id FROM financial_proposal WHERE workspace_id=? ORDER BY expires_at DESC,id DESC LIMIT 1",
          )
          .get(expiryWorkspace.id) as { id: string }
      ).id,
      bytes = inputs.get(target)!;
    clock += pendingLifetime + 1;
    assert.equal(service.replay(user, expiryWorkspace.id, bytes), undefined);
    assert.equal(
      (
        db
          .prepare(
            "SELECT COUNT(*) n FROM financial_marker WHERE workspace_id=?",
          )
          .get(expiryWorkspace.id) as { n: number }
      ).n,
      0,
    );
    assert.notEqual(
      service.import(user, expiryWorkspace.id, bytes, decoded).id,
      target,
    );
    const contents = JSON.stringify(
      db.prepare("SELECT observations FROM financial_evidence").all(),
    );
    assert.ok(!contents.includes("MIME-Version"));
    assert.ok(!contents.includes("Te informamos"));
    assert.equal((db.pragma("foreign_key_check") as unknown[]).length, 0);
  } finally {
    db.close();
    await system.app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("version 1 store upgrades in place preserving accounts and membership", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-migration-"));
  const config = {
    mode: "development-loopback" as const,
    origin: "http://127.0.0.1:4174",
    port: 4174,
    dataDirectory: directory,
    authSecret: randomBytes(32).toString("hex"),
  };
  let system = await createApp(config);
  const account = {
    email: "synthetic-migration@example.test",
    name: "Migración sintética",
    password: randomBytes(24).toString("base64url"),
  };
  try {
    const w = await system.workspaces.bootstrap(account, "Conservar espacio");
    await system.app.close();
    const db = openStore(directory);
    db.exec(
      "DROP TABLE financial_marker; DROP TABLE financial_record; DROP TABLE financial_proposal; DROP TABLE financial_evidence; DELETE FROM application_migration WHERE version=2;",
    );
    db.close();
    // A colliding schema object forces migration failure. It must roll back,
    // retain the populated v1 store, and permit a deliberate repair/retry.
    const broken = openStore(directory);
    broken.exec("CREATE TABLE financial_evidence(dummy TEXT);");
    broken.close();
    await assert.rejects(createApp(config), /already exists/);
    const intact = openStore(directory);
    assert.equal(
      (
        intact
          .prepare("SELECT MAX(version) v FROM application_migration")
          .get() as { v: number }
      ).v,
      1,
    );
    assert.equal(
      (
        intact
          .prepare("SELECT COUNT(*) n FROM membership WHERE workspace_id=?")
          .get(w.id) as { n: number }
      ).n,
      1,
    );
    assert.equal(
      intact
        .prepare(
          "SELECT name FROM sqlite_master WHERE name='financial_proposal'",
        )
        .get(),
      undefined,
    );
    intact.exec("DROP TABLE financial_evidence;");
    intact.close();
    system = await createApp(config);
    const login = await system.app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: {
        host: "127.0.0.1:4174",
        origin: config.origin,
        "content-type": "application/json",
      },
      payload: account,
    });
    assert.equal(login.statusCode, 200);
    const cookie = login.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const workspaces = await system.app.inject({
      url: "/api/workspaces",
      headers: { host: "127.0.0.1:4174", cookie },
    });
    assert.equal(workspaces.json().workspaces[0].id, w.id);
    assert.equal(
      (
        await system.app.inject({
          url: `/api/workspaces/${w.id}/ledger`,
          headers: { host: "127.0.0.1:4174", cookie },
        })
      ).json().totals.count,
      0,
    );
  } finally {
    await system.app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
