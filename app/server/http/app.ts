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
    const app = Fastify({
      logger: false,
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
      if (request.headers.host !== new URL(config.origin).host)
        throw new AppError(403, "ORIGIN_NOT_ALLOWED");
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        if (
          request.headers.origin !== config.origin ||
          request.headers["content-type"]?.split(";")[0] !== "application/json"
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
    });
    app.setErrorHandler((error, request, reply) => {
      const code =
        error && typeof error === "object" && "statusCode" in error
          ? Number(error.statusCode)
          : 500;
      const status =
        error instanceof AppError
          ? error.status
          : code >= 400 && code < 500
            ? code
            : 500;
      reply
        .status(status)
        .send({
          code:
            error instanceof AppError
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
        return reply
          .status(response.status)
          .send(
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
    app.addHook("onClose", async () => db.close());
    return { app, workspaces, authentication };
  } catch (error) {
    db.close();
    throw error;
  }
}
