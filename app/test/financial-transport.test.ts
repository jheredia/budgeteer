import { test } from "node:test";
import assert from "node:assert/strict";
import { connect, type Socket } from "node:net";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createApp } from "../server/http/app.js";
import { syntheticMime } from "../server/imports/synthetic.js";
test("real sockets enforce denial before body, actor admission, disconnect cleanup, 10s headers/idle and 30s preparse deadline", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-transport-"));
  const origin = "http://127.0.0.1:4174";
  const system = await createApp({
    mode: "development-loopback",
    origin,
    port: 4174,
    dataDirectory: directory,
    authSecret: randomBytes(32).toString("hex"),
  });
  const sockets: Socket[] = [];
  let releaseAuth = () => {};
  try {
    const credentials = {
      email: "synthetic-transport@example.test",
      name: "Transporte sintético",
      password: randomBytes(24).toString("base64url"),
    };
    const workspace = await system.workspaces.bootstrap(
      credentials,
      "Transporte",
    );
    const login = await system.app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: {
        host: "127.0.0.1:4174",
        origin,
        "content-type": "application/json",
      },
      payload: credentials,
    });
    const cookie = login.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    await system.app.listen({ host: "127.0.0.1", port: 0 });
    const address = system.app.server.address();
    assert.ok(address && typeof address !== "string");
    const port = address.port;
    const uploadPath = `/api/workspaces/${workspace.id}/imports?contract=banco_chile_debit_v1`;
    const headers = (auth = true) =>
      `POST ${uploadPath} HTTP/1.1\r\nHost: 127.0.0.1:4174\r\nOrigin: ${origin}\r\nContent-Type: application/octet-stream\r\nX-Budgeteer-Synthetic: yes\r\n${auth ? `Cookie: ${cookie}\r\n` : ""}Content-Length: 10000\r\n\r\n`;
    async function socket() {
      const s = connect(port, "127.0.0.1");
      s.on("error", () => {});
      sockets.push(s);
      await once(s, "connect");
      return s;
    }
    const closed = (s: Socket) =>
      new Promise<{ elapsed: number; response: string }>((resolve) => {
        const started = Date.now();
        let response = "";
        s.on("data", (chunk) => (response += chunk.toString()));
        s.once("close", () =>
          resolve({ elapsed: Date.now() - started, response }),
        );
      });
    const denied = await socket(),
      denial = closed(denied);
    denied.write(headers(false));
    const d = await denial;
    assert.ok(d.elapsed < 3000);
    assert.match(d.response, /401/);
    const heldA = await socket(),
      heldB = await socket();
    heldA.write(headers());
    heldB.write(headers());
    // A third request cannot queue behind the actor's two unread admitted bodies.
    await new Promise((resolve) => setTimeout(resolve, 100));
    const third = await socket(),
      thirdClosed = closed(third);
    third.write(headers());
    const busy = await thirdClosed;
    assert.match(busy.response, /429/);
    assert.match(busy.response, /retry-after: 1/i);
    heldA.destroy();
    heldB.destroy();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const raw = Buffer.from(syntheticMime("banco_chile_debit_v1"));
    const valid = await system.app.inject({
      method: "POST",
      url: uploadPath,
      headers: {
        host: "127.0.0.1:4174",
        origin,
        "content-type": "application/octet-stream",
        "x-budgeteer-synthetic": "yes",
        cookie,
      },
      payload: raw,
    });
    assert.equal(valid.statusCode, 200, valid.body);
    const slowHeader = await socket(),
      headerResult = closed(slowHeader);
    slowHeader.write(
      `POST ${uploadPath} HTTP/1.1\r\nHost: 127.0.0.1:4174\r\nX-Synthetic: `,
    );
    const trickle = setInterval(() => slowHeader.write("a"), 500);
    const idle = await socket(),
      idleResult = closed(idle);
    idle.write(headers());
    const original = system.authentication.resolveActor;
    const gate = new Promise<void>((resolve) => (releaseAuth = resolve));
    system.authentication.resolveActor = async (h) => {
      await gate;
      return original(h);
    };
    const delayed = await socket(),
      delayedResult = closed(delayed);
    delayed.write(headers());
    const authTrickle = setInterval(() => delayed.write("x"), 500);
    const [header, idleClose, total] = await Promise.all([
      headerResult,
      idleResult,
      delayedResult,
    ]);
    clearInterval(trickle);
    clearInterval(authTrickle);
    releaseAuth();
    system.authentication.resolveActor = original;
    assert.ok(
      header.elapsed >= 9500 && header.elapsed < 12000,
      `header cutoff ${header.elapsed}`,
    );
    assert.ok(
      idleClose.elapsed >= 9500 && idleClose.elapsed < 12000,
      `idle cutoff ${idleClose.elapsed}`,
    );
    // Socket idle is an earlier valid cutoff for a completely idle unauthenticated
    // preparse request. Trickle body below proves the independent whole budget.
    assert.ok(
      total.elapsed >= 29000 && total.elapsed < 32000,
      `preauth cutoff ${total.elapsed}`,
    );
    const slow = await socket(),
      slowResult = closed(slow);
    slow.write(headers());
    const bodyTrickle = setInterval(() => slow.write("x"), 500);
    const slowClose = await slowResult;
    clearInterval(bodyTrickle);
    assert.ok(
      slowClose.elapsed >= 29000 && slowClose.elapsed < 32000,
      `whole cutoff ${slowClose.elapsed}`,
    );
    assert.equal(
      (
        await system.app.inject({
          method: "POST",
          url: uploadPath,
          headers: {
            host: "127.0.0.1:4174",
            origin,
            "content-type": "application/octet-stream",
            "x-budgeteer-synthetic": "yes",
            cookie,
          },
          payload: raw,
        })
      ).statusCode,
      200,
    );
  } finally {
    releaseAuth();
    sockets.forEach((s) => s.destroy());
    await system.app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
