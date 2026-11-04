import staticFiles from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify, { type FastifyRequest } from "fastify";
import { openStore, migrateApplication } from "../persistence/sqlite/store.js";
import { workspaceRepository } from "../persistence/sqlite/workspaces.js";
import { workspaceServices } from "../application/workspaces.js";
import { createAuthentication } from "../auth/authentication.js";
import { AppError, type Actor } from "../domain/model.js";
import type { Config } from "../config.js";
import { financialServices } from "../application/finances.js";
import { financialRepository } from "../persistence/sqlite/finances.js";
import { MimeParser } from "../imports/parser.js";
import {
  syntheticMime,
  importContracts,
  type ImportContract,
} from "../imports/synthetic.js";
import { UploadAdmission, uploads, releaseUpload } from "./uploads.js";
function requestHeaders(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string" && !key.startsWith("x-forwarded-"))
      headers.set(key, value);
  }
  headers.set("x-forwarded-for", request.ip);
  return headers;
}
function body(request: FastifyRequest): Record<string, unknown> {
  if (
    !request.body ||
    typeof request.body !== "object" ||
    Array.isArray(request.body)
  )
    throw new AppError(422, "INVALID_INPUT");
  return request.body as Record<string, unknown>;
}
const requiredString = (value: unknown, max = 128) => {
  if (typeof value !== "string" || !value || value.length > max)
    throw new AppError(422, "INVALID_INPUT");
  return value;
};
export async function createApp(config: Config) {
  const db = openStore(config.dataDirectory);
  try {
    const authentication = await createAuthentication(db, config);
    migrateApplication(db);
    const workspaces = workspaceServices(
      workspaceRepository(db),
      authentication,
    );
    const finances = financialServices(
      financialRepository(db),
      config.authSecret,
    );
    finances.sweep();
    const parser = new MimeParser();
    const admission = new UploadAdmission();
    const sweepTimer = setInterval(() => {
      try {
        finances.sweep();
      } catch {
        /* Retry next interval. */
      }
    }, 60000);
    sweepTimer.unref();
    const app = Fastify({
      logger: false,
      http: { headersTimeout: 10000, connectionsCheckingInterval: 250 },
      bodyLimit: 16384,
      requestTimeout: 30000,
      connectionTimeout: 10000,
      trustProxy: config.mode === "shared-https" ? config.trustedProxy : false,
    });
    app.server.headersTimeout = 10000;
    const actors = new WeakMap<FastifyRequest, Actor>();
    const actor = (request: FastifyRequest) => {
      const value = actors.get(request);
      if (!value) throw new AppError(401, "AUTHENTICATION_REQUIRED");
      return value;
    };
    app.addHook("onRequest", async (request, reply) => {
      reply
        .header("cache-control", "no-store")
        .header("x-content-type-options", "nosniff")
        .header("referrer-policy", "no-referrer");
      reply.header(
        "content-security-policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      );
      const url = new URL(request.url, config.origin);
      const isUpload =
        request.method === "POST" &&
        /^\/api\/workspaces\/[^/]+\/imports$/.test(url.pathname);
      if (isUpload) {
        const controller = new AbortController();
        const timer = setTimeout(() => {
          request.raw.destroy();
          releaseUpload(request);
        }, 30000);
        uploads.set(request, { controller, timer, release: () => {} });
        request.raw.once("aborted", () => releaseUpload(request));
        reply.raw.once("close", () => releaseUpload(request));
      }
      if (request.headers.host !== new URL(config.origin).host)
        throw new AppError(403, "ORIGIN_NOT_ALLOWED");
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        if (
          request.headers.origin !== config.origin ||
          request.headers["content-type"]?.split(";")[0] !==
            (request.method === "POST" &&
            /^\/api\/workspaces\/[^/]+\/imports$/.test(url.pathname)
              ? "application/octet-stream"
              : "application/json")
        )
          throw new AppError(403, "ORIGIN_NOT_ALLOWED");
      }
      if (
        url.pathname.startsWith("/api/") &&
        !url.pathname.startsWith("/api/auth/") &&
        url.pathname !== "/api/enroll"
      ) {
        actors.set(
          request,
          await authentication.resolveActor(requestHeaders(request)),
        );
      }
      if (
        request.method === "POST" &&
        /^\/api\/workspaces\/[^/]+\/imports$/.test(url.pathname)
      ) {
        const workspaceId = decodeURIComponent(url.pathname.split("/")[3]!);
        finances.authorize(actor(request).id, workspaceId);
        if (request.headers["x-budgeteer-synthetic"] !== "yes")
          throw new AppError(422, "SYNTHETIC_ONLY");
        const context = uploads.get(request);
        if (!context) throw new AppError(408, "UPLOAD_TIMEOUT");
        context.release = admission.acquire(actor(request).id);
      }
    });
    app.addContentTypeParser(
      "application/octet-stream",
      (request, payload, done) => {
        const context = uploads.get(request);
        if (!context) {
          done(new AppError(404, "NOT_FOUND"));
          return;
        }
        let chunks: Buffer[] = [],
          size = 0,
          finished = false;
        let idle: ReturnType<typeof setTimeout>;
        const stop = (error?: Error, result?: Buffer) => {
          if (finished) return;
          finished = true;
          clearTimeout(idle);
          payload.removeListener("data", data);
          chunks.forEach((chunk) => chunk.fill(0));
          chunks = [];
          done(error ?? null, result);
        };
        const arm = () => {
          clearTimeout(idle);
          idle = setTimeout(() => {
            stop(new AppError(408, "UPLOAD_IDLE_TIMEOUT"));
            releaseUpload(request);
            payload.destroy();
          }, 10000);
        };
        const data = (chunk: Buffer) => {
          size += chunk.length;
          if (size > 1048576) {
            stop(new AppError(413, "INPUT_TOO_LARGE"));
            releaseUpload(request);
            payload.destroy();
            return;
          }
          chunks.push(Buffer.from(chunk));
          arm();
        };
        context.controller.signal.addEventListener(
          "abort",
          () => stop(new AppError(408, "UPLOAD_ABORTED")),
          { once: true },
        );
        payload.on("data", data);
        payload.once("error", () => {
          stop(new AppError(400, "INVALID_INPUT"));
          releaseUpload(request);
        });
        payload.once("end", () => {
          if (finished) return;
          const buffer = Buffer.concat(chunks);
          context.buffer = buffer;
          stop(undefined, buffer);
        });
        arm();
      },
    );
    app.addHook("onResponse", async (request) => releaseUpload(request));
    app.addHook("onTimeout", async (request) => releaseUpload(request));
    app.addHook("onError", async (request) => releaseUpload(request));
    app.setErrorHandler((error, request, reply) => {
      const code =
        error && typeof error === "object" && "statusCode" in error
          ? Number(error.statusCode)
          : 500;
      const storeUnavailable =
        error &&
        typeof error === "object" &&
        "code" in error &&
        /^(SQLITE_BUSY|SQLITE_LOCKED)(_|$)/.test(String(error.code));
      const status = storeUnavailable
        ? 503
        : error instanceof AppError
          ? error.status
          : code >= 400 && code < 500
            ? code
            : 500;
      if (/^\/api\/workspaces\/[^/]+\/imports(?:\?|$)/.test(request.url)) {
        reply.header("connection", "close");
        const socket = request.raw.socket;
        reply.raw.once("finish", () => socket.destroy());
      }
      if (
        storeUnavailable ||
        (error instanceof AppError &&
          ["UPLOAD_BUSY", "PARSER_BUSY"].includes(error.code))
      )
        reply.header("retry-after", "1");
      reply.status(status).send({
        code: storeUnavailable
          ? "STORE_UNAVAILABLE"
          : error instanceof AppError
            ? error.code
            : status === 500
              ? "INTERNAL_ERROR"
              : "INVALID_REQUEST",
      });
    });
    app.route({
      method: ["GET", "POST"],
      url: "/api/auth/*",
      handler: async (request, reply) => {
        const pathname = new URL(request.url, config.origin).pathname;
        if (
          request.method !== "POST" ||
          !["/api/auth/sign-in/email", "/api/auth/sign-out"].includes(pathname)
        )
          throw new AppError(404, "NOT_FOUND");
        const response = await authentication.auth.handler(
          new Request(config.origin + request.url, {
            method: request.method,
            headers: requestHeaders(request),
            body: JSON.stringify(request.body),
          }),
        );
        const cookies = response.headers.getSetCookie();
        if (cookies.length) reply.header("set-cookie", cookies);
        // The maintained library returns usable session tokens in JSON; browser callers receive cookies only.
        return reply.status(response.status).send(
          response.ok
            ? { ok: true }
            : {
                code:
                  response.status === 429
                    ? "RATE_LIMITED"
                    : "AUTHENTICATION_FAILED",
              },
        );
      },
    });
    app.get("/api/session", async (request) => ({ user: actor(request) }));
    app.get("/api/workspaces", async (request) => ({
      workspaces: workspaces.list(actor(request).id),
    }));
    app.post("/api/workspaces", async (request) => ({
      workspace: workspaces.create(
        actor(request).id,
        requiredString(body(request).name, 100),
      ),
    }));
    app.get<{ Params: { workspaceId: string } }>(
      "/api/workspaces/:workspaceId/members",
      async (request) => ({
        members: workspaces.members(
          actor(request).id,
          request.params.workspaceId,
        ),
      }),
    );
    app.post<{ Params: { workspaceId: string } }>(
      "/api/workspaces/:workspaceId/invitations",
      async (request) =>
        workspaces.invite(actor(request).id, request.params.workspaceId),
    );
    app.delete<{ Params: { workspaceId: string; id: string } }>(
      "/api/workspaces/:workspaceId/invitations/:id",
      async (request) => {
        workspaces.revoke(
          actor(request).id,
          request.params.workspaceId,
          request.params.id,
        );
        return { ok: true };
      },
    );
    app.delete<{ Params: { workspaceId: string; userId: string } }>(
      "/api/workspaces/:workspaceId/members/:userId",
      async (request) => {
        workspaces.remove(
          actor(request).id,
          request.params.workspaceId,
          request.params.userId,
        );
        return { ok: true };
      },
    );
    app.post("/api/invitations/accept", async (request) =>
      workspaces.accept(actor(request).id, requiredString(body(request).token)),
    );
    app.post("/api/enroll", async (request) => {
      const input = body(request);
      try {
        return await workspaces.enroll(requiredString(input.token), {
          email: requiredString(input.email, 254),
          password: requiredString(input.password),
          name: requiredString(input.name, 100),
        });
      } catch {
        throw new AppError(422, "ENROLLMENT_UNAVAILABLE");
      }
    });
    app.post<{
      Params: { workspaceId: string };
      Querystring: { contract?: string };
    }>("/api/workspaces/:workspaceId/imports", async (request) => {
      const context = uploads.get(request);
      if (!context || !Buffer.isBuffer(request.body))
        throw new AppError(422, "INVALID_INPUT");
      try {
        if (!importContracts.includes(request.query.contract as ImportContract))
          throw new AppError(422, "UNSUPPORTED_CONTRACT");
        const replay = finances.replay(
          actor(request).id,
          request.params.workspaceId,
          request.body,
        );
        if (replay) return { ...replay, replayed: true };
        const decoded = await parser.parse(
          request.body,
          request.query.contract ?? "",
          context.controller.signal,
        );
        return finances.import(
          actor(request).id,
          request.params.workspaceId,
          request.body,
          decoded,
        );
      } finally {
        releaseUpload(request);
      }
    });
    app.post<{ Params: { workspaceId: string } }>(
      "/api/workspaces/:workspaceId/synthetic-example",
      async (request) => {
        finances.authorize(actor(request).id, request.params.workspaceId);
        const contract = body(request).contract;
        if (!importContracts.includes(contract as ImportContract))
          throw new AppError(422, "UNSUPPORTED_CONTRACT");
        const release = admission.acquire(actor(request).id),
          raw = Buffer.from(syntheticMime(contract as ImportContract));
        try {
          const replay = finances.replay(
            actor(request).id,
            request.params.workspaceId,
            raw,
          );
          if (replay) return { ...replay, replayed: true };
          return finances.import(
            actor(request).id,
            request.params.workspaceId,
            raw,
            await parser.parse(raw, contract as string),
          );
        } finally {
          raw.fill(0);
          release();
        }
      },
    );
    app.get<{
      Params: { workspaceId: string };
      Querystring: { cursor?: string };
    }>("/api/workspaces/:workspaceId/proposals", async (request) =>
      finances.pending(
        actor(request).id,
        request.params.workspaceId,
        request.query.cursor,
      ),
    );
    app.get<{ Params: { workspaceId: string; id: string } }>(
      "/api/workspaces/:workspaceId/proposals/:id",
      async (request) =>
        finances.proposal(
          actor(request).id,
          request.params.workspaceId,
          request.params.id,
        ),
    );
    app.post<{ Params: { workspaceId: string; id: string } }>(
      "/api/workspaces/:workspaceId/proposals/:id/approve",
      async (request) =>
        finances.approve(
          actor(request).id,
          request.params.workspaceId,
          request.params.id,
          body(request).fields,
          body(request).expectedVersion,
        ),
    );
    app.delete<{ Params: { workspaceId: string; id: string } }>(
      "/api/workspaces/:workspaceId/proposals/:id",
      async (request) =>
        finances.ignore(
          actor(request).id,
          request.params.workspaceId,
          request.params.id,
        ),
    );
    app.get<{
      Params: { workspaceId: string };
      Querystring: Record<string, string>;
    }>("/api/workspaces/:workspaceId/ledger", async (request) =>
      finances.ledger(actor(request).id, request.params.workspaceId, {
        ...request.query,
        limit:
          request.query.limit === undefined
            ? undefined
            : Number(request.query.limit),
      }),
    );
    app.get<{ Params: { workspaceId: string; id: string } }>(
      "/api/workspaces/:workspaceId/ledger/:id",
      async (request) =>
        finances.record(
          actor(request).id,
          request.params.workspaceId,
          request.params.id,
        ),
    );
    const root = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    await app.register(staticFiles, {
      root: path.join(root, "client/public"),
      index: "index.html",
    });
    app.get("/client.js", async (request, reply) =>
      reply.sendFile("client.js", path.join(root, "dist")),
    );
    app.addHook("onClose", async () => {
      clearInterval(sweepTimer);
      await parser.close();
      db.close();
    });
    return { app, workspaces, authentication, finances };
  } catch (error) {
    db.close();
    throw error;
  }
}
