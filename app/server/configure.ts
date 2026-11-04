import { randomBytes } from "node:crypto";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { dataDirectoryFromEnvironment } from "./data-location.js";
const directory = dataDirectoryFromEnvironment();
await mkdir(directory, { recursive: true, mode: 0o700 });
if (((await stat(directory)).mode & 0o077) !== 0)
  throw new Error("PRIVATE_DATA_DIRECTORY_REQUIRED");
try {
  await writeFile(
    path.join(directory, "auth-secret"),
    randomBytes(32).toString("base64url"),
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Se creó la clave local protegida. No se imprimió su valor. Ejecuta npm run setup.",
  );
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "EEXIST")
    console.log("La clave ya existe; se conservó sin mostrarla.");
  else throw error;
}
