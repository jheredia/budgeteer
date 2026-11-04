import { createInterface } from "node:readline/promises";
import { readConfig } from "./config.js";
import { createApp } from "./http/app.js";
async function passwordPrompt(): Promise<string> {
  if (!process.stdin.isTTY) throw new Error("INTERACTIVE_TERMINAL_REQUIRED");
  process.stdout.write("Contraseña (mínimo 12 caracteres, no se muestra): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      process.stdin.off("data", receive);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const receive = (data: Buffer) => {
      for (const character of data.toString("utf8")) {
        if (character === "\u0003") {
          finish();
          reject(new Error("CANCELLED"));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (character === "\u007f") value = value.slice(0, -1);
        else if (character >= " ") {
          if (value.length >= 128) {
            finish();
            reject(new Error("PASSWORD_TOO_LONG"));
            return;
          }
          value += character;
        }
      }
    };
    process.stdin.on("data", receive);
  });
}
const prompt = createInterface({
  input: process.stdin,
  output: process.stdout,
});
const email = await prompt.question("Identificador de inicio (correo): ");
const name = await prompt.question("Nombre para mostrar: ");
const workspaceName = await prompt.question("Nombre del espacio: ");
prompt.close();
const password = await passwordPrompt();
const system = await createApp(readConfig());
try {
  await system.workspaces.bootstrap({ email, name, password }, workspaceName);
  console.log(
    "Cuenta y espacio inicial creados. Inicia la aplicación para entrar.",
  );
} catch {
  console.error(
    "BOOTSTRAP_FAILED: comprueba los datos o que la configuración inicial no esté cerrada.",
  );
  process.exitCode = 1;
} finally {
  await system.app.close();
}
