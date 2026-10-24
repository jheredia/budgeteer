import { AsyncLocalStorage } from "node:async_hooks";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { getMigrations } from "better-auth/db/migration";
import type { Config } from "../config.js";
import type { Store } from "../persistence/sqlite/store.js";
import { AppError, type Actor } from "../domain/model.js";
import type { AccountInput } from "../application/accounts.js";
export async function createAuthentication(db: Store, config: Config) {
  const enrollment = new AsyncLocalStorage<boolean>();
  const auth = betterAuth({
    database: db,
    secret: config.authSecret,
    baseURL: config.origin,
    trustedOrigins: [config.origin],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false,
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 900,
      max: 100,
      customRules: { "/sign-in/email": { window: 900, max: 5 } },
    },
    advanced: {
      useSecureCookies: config.mode === "shared-https",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.mode === "shared-https",
        path: "/",
      },
    },
    logger: { disabled: true },
    databaseHooks: {
      user: {
        create: {
          before: async () => {
            if (!enrollment.getStore())
              throw new APIError("FORBIDDEN", {
                message: "ENROLLMENT_REQUIRED",
              });
          },
        },
      },
    },
  });
  await (await getMigrations(auth.options)).runMigrations();
  async function provisionAccount(input: AccountInput) {
    // Private server context. No client flag or header can grant enrollment.
    if (
      db
        .prepare("SELECT id FROM user WHERE email=?")
        .get(input.email.toLowerCase())
    )
      throw new AppError(409, "ACCOUNT_ALREADY_EXISTS");
    return enrollment.run(true, () => auth.api.signUpEmail({ body: input }));
  }
  async function resolveActor(headers: Headers): Promise<Actor> {
    const result = await auth.api.getSession({ headers });
    if (!result) throw new AppError(401, "AUTHENTICATION_REQUIRED");
    const last = db
      .prepare("SELECT last_seen FROM app_session_activity WHERE session_id=?")
      .get(result.session.id) as { last_seen: number } | undefined;
    const now = Date.now();
    if (
      now - (last?.last_seen ?? result.session.createdAt.getTime()) >
      24 * 60 * 60 * 1000
    ) {
      await auth.api.revokeSession({
        headers,
        body: { token: result.session.token },
      });
      throw new AppError(401, "SESSION_EXPIRED");
    }
    db.prepare(
      "INSERT INTO app_session_activity(session_id,last_seen) VALUES(?,?) ON CONFLICT(session_id) DO UPDATE SET last_seen=excluded.last_seen",
    ).run(result.session.id, now);
    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    };
  }
  async function recoverBootstrapAccount(input: AccountInput) {
    const response = await auth.api.signInEmail({
      body: input,
      asResponse: true,
    });
    if (!response.ok) throw new AppError(422, "BOOTSTRAP_RECOVERY_FAILED");
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const headers = new Headers({ cookie });
    const result = await auth.api.getSession({ headers });
    if (!result) throw new AppError(422, "BOOTSTRAP_RECOVERY_FAILED");
    await auth.api.signOut({ headers });
    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
    };
  }
  return { auth, provisionAccount, recoverBootstrapAccount, resolveActor };
}
export type Authentication = Awaited<ReturnType<typeof createAuthentication>>;
