import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function dataDirectoryFromEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): string {
  let existing = path.resolve(
    env.BUDGETEER_DATA_DIRECTORY ||
      path.join(homedir(), ".local/share/budgeteer"),
  );
  const missing: string[] = [];
  while (true) {
    try {
      existing = realpathSync(existing);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new Error("DATA_DIRECTORY_UNAVAILABLE");
      const parent = path.dirname(existing);
      if (parent === existing) throw new Error("DATA_DIRECTORY_UNAVAILABLE");
      missing.unshift(path.basename(existing));
      existing = parent;
    }
  }
  const directory = path.join(existing, ...missing);
  const repository = realpathSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
  );
  if (directory === repository || directory.startsWith(repository + path.sep))
    throw new Error("DATA_DIRECTORY_MUST_BE_OUTSIDE_REPOSITORY");
  return directory;
}
