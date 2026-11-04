import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createApp } from "../server/http/app.js";
import type { Config } from "../server/config.js";

test("HTTP auth invitation boundaries, shared membership, isolation, revocation and restart", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-shared-"));
  const config: Config = {
    mode: "development-loopback",
    origin: "http://127.0.0.1:4174",
    port: 4174,
    dataDirectory: directory,
    authSecret: randomBytes(32).toString("hex"),
  };
  let system = await createApp(config);
  const password = () => randomBytes(24).toString("base64url");
  const owner = {
    email: "synthetic-owner@example.test",
    password: password(),
    name: "Propietario sintético",
  };
  const member = {
    email: "synthetic-member@example.test",
    password: password(),
    name: "Miembro sintético",
  };
  const outsider = {
    email: "synthetic-other@example.test",
    password: password(),
    name: "Otra persona sintética",
  };
  const headers = (cookie = "") => ({
    host: "127.0.0.1:4174",
    origin: config.origin,
    "content-type": "application/json",
    cookie,
  });
  const login = async (input: typeof owner) => {
    const response = await system.app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: headers(),
      payload: input,
    });
    assert.equal(response.statusCode, 200);
    assert.ok(
      Object.keys(response.json()).join(",") === "ok" &&
        response.json().ok === true,
      "No session bearer may be serialized to API bodies",
    );
    return response.cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  };
  try {
    const workspace = await system.workspaces.bootstrap(
      owner,
      "Espacio compartido sintético",
    );
    await assert.rejects(system.workspaces.bootstrap(outsider, "No permitido"));
    const ownerCookie = await login(owner);
    const rawSignup = await system.app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: headers(),
      payload: member,
    });
    assert.equal(rawSignup.statusCode, 404);
    const session = await system.app.inject({
      url: "/api/session",
      headers: headers(ownerCookie),
    });
    assert.equal(session.statusCode, 200);
    assert.ok(!("token" in session.json()), "Safe session DTO only");
    const invitation = await system.app.inject({
      method: "POST",
      url: `/api/workspaces/${workspace.id}/invitations`,
      headers: headers(ownerCookie),
      payload: {},
    });
    assert.equal(invitation.statusCode, 200);
    const token = invitation.json().token as string;
    const enrolled = await system.app.inject({
      method: "POST",
      url: "/api/enroll",
      headers: headers(),
      payload: { ...member, token },
    });
    assert.equal(enrolled.statusCode, 200);
    const replay = await system.app.inject({
      method: "POST",
      url: "/api/enroll",
      headers: headers(),
      payload: { ...outsider, token },
    });
    assert.equal(replay.statusCode, 422);
    const memberCookie = await login(member);
    const ownerList = await system.app.inject({
      url: "/api/workspaces",
      headers: headers(ownerCookie),
    });
    const memberList = await system.app.inject({
      url: "/api/workspaces",
      headers: headers(memberCookie),
    });
    assert.equal(
      ownerList.json().workspaces[0].id,
      memberList.json().workspaces[0].id,
    );
    const memberActor = (
      await system.app.inject({
        url: "/api/session",
        headers: headers(memberCookie),
      })
    ).json().user;
    assert.equal(
      (
        await system.app.inject({
          url: `/api/workspaces/${workspace.id}/members`,
          headers: headers(memberCookie),
        })
      ).json().members.length,
      2,
    );
    await system.authentication.provisionAccount(outsider);
    const outsiderCookie = await login(outsider);
    assert.equal(
      (
        await system.app.inject({
          url: `/api/workspaces/${workspace.id}/members`,
          headers: headers(outsiderCookie),
        })
      ).statusCode,
      404,
    );
    assert.equal(
      (
        await system.app.inject({
          method: "POST",
          url: `/api/workspaces/${workspace.id}/invitations`,
          headers: headers(memberCookie),
          payload: {},
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await system.app.inject({
          method: "POST",
          url: `/api/workspaces/${workspace.id}/invitations`,
          headers: {
            ...headers(ownerCookie),
            origin: "https://untrusted.example",
          },
          payload: {},
        })
      ).statusCode,
      403,
    );
    await system.app.close();
    system = await createApp(config);
    assert.equal(
      (
        await system.app.inject({
          url: `/api/workspaces/${workspace.id}/members`,
          headers: headers(memberCookie),
        })
      ).json().members.length,
      2,
    );
    const removed = await system.app.inject({
      method: "DELETE",
      url: `/api/workspaces/${workspace.id}/members/${memberActor.id}`,
      headers: headers(ownerCookie),
      payload: {},
    });
    assert.equal(removed.statusCode, 200);
    assert.equal(
      (
        await system.app.inject({
          url: `/api/workspaces/${workspace.id}/members`,
          headers: headers(memberCookie),
        })
      ).statusCode,
      404,
    );
    const logout = await system.app.inject({
      method: "POST",
      url: "/api/auth/sign-out",
      headers: headers(ownerCookie),
      payload: {},
    });
    assert.equal(logout.statusCode, 200);
    assert.equal(
      (
        await system.app.inject({
          url: "/api/session",
          headers: headers(ownerCookie),
        })
      ).statusCode,
      401,
    );
  } finally {
    await system.app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
