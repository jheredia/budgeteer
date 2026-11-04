import { readFileSync, statSync } from "node:fs";
import { dataDirectoryFromEnvironment } from "./data-location.js";
import path from "node:path";
export interface Config {
  mode: "development-loopback" | "shared-https";
  origin: string;
  port: number;
  dataDirectory: string;
  authSecret: string;
  trustedProxy?: string;
}
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const mode = env.BUDGETEER_MODE || "development-loopback";
  if (mode !== "development-loopback" && mode !== "shared-https")
    throw new Error("INVALID_MODE");
  const port = Number(env.PORT || 4174);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("INVALID_PORT");
  const origin = new URL(env.BUDGETEER_ORIGIN || `http://127.0.0.1:${port}`)
    .origin;
  const url = new URL(origin);
  const dataDirectory = dataDirectoryFromEnvironment(env);
  let authSecret = env.BETTER_AUTH_SECRET || "";
  if (!authSecret) {
    try {
      const secretPath = path.join(dataDirectory, "auth-secret");
      if ((statSync(secretPath).mode & 0o077) !== 0)
        throw new Error("INSECURE_SECRET_PERMISSIONS");
      authSecret = readFileSync(secretPath, "utf8").trim();
    } catch {
      throw new Error("AUTH_SECRET_REQUIRED_RUN_CONFIGURE");
    }
  }
  if (authSecret.length < 32) throw new Error("AUTH_SECRET_REQUIRED");
  if (
    mode === "development-loopback" &&
    (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      url.protocol !== "http:")
  )
    throw new Error("INVALID_DEVELOPMENT_ORIGIN");
  if (
    mode === "shared-https" &&
    (url.protocol !== "https:" ||
      !env.BUDGETEER_TRUSTED_PROXY ||
      env.BUDGETEER_ENCRYPTED_STORAGE_CONFIRMED !== "yes")
  )
    throw new Error("SHARED_HTTPS_STORAGE_CONFIGURATION_REQUIRED");
  return {
    mode,
    origin,
    port,
    authSecret,
    dataDirectory,
    trustedProxy: env.BUDGETEER_TRUSTED_PROXY,
  };
}
