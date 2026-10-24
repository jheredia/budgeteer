import type { FastifyInstance } from "fastify";
import { readConfig } from "./config.js";
import { createApp } from "./http/app.js";
let app: FastifyInstance | undefined;
try {
  const config = readConfig();
  ({ app } = await createApp(config));
  await app.listen({ host: "127.0.0.1", port: config.port });
  console.log(`Budgeteer: ${config.origin}`);
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => void app?.close());
} catch {
  if (app) await app.close();
  console.error(
    "STARTUP_FAILED: comprueba la configuración protegida, la clave local y el almacén. Consulta app/README.md.",
  );
  process.exitCode = 1;
}
