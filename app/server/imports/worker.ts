import { parentPort, workerData } from "node:worker_threads";
import { decodeMime } from "./decode.js";
try {
  const result = await decodeMime(
    Buffer.from(workerData.raw),
    workerData.contract,
  );
  parentPort!.postMessage({ ok: true, result });
} catch (error) {
  const code =
    error instanceof Error &&
    [
      "UNSUPPORTED_CONTRACT",
      "UNSUPPORTED_FORMAT",
      "INVALID_INPUT",
      "AMBIGUOUS_INPUT",
    ].includes(error.message)
      ? error.message
      : "INVALID_INPUT";
  parentPort!.postMessage({ ok: false, code });
}
