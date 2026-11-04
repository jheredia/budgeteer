import { Worker } from "node:worker_threads";
import { AppError } from "../domain/model.js";
import type { DecodedImport } from "./decode.js";
export class MimeParser {
  private active = new Set<Worker>();
  constructor(
    private deadline = 5000,
    private workerUrl = new URL(
      "../../dist/import-worker.mjs",
      import.meta.url,
    ),
  ) {}
  get activeCount() {
    return this.active.size;
  }
  async parse(
    raw: Buffer,
    contract: string,
    signal?: AbortSignal,
  ): Promise<DecodedImport> {
    if (this.active.size >= 2) throw new AppError(503, "PARSER_BUSY");
    if (signal?.aborted) throw new AppError(408, "UPLOAD_ABORTED");
    if (raw.length > 1048576) throw new AppError(413, "INPUT_TOO_LARGE");
    const worker = new Worker(this.workerUrl, {
      workerData: { raw, contract },
      resourceLimits: { maxOldGenerationSizeMb: 64, stackSizeMb: 2 },
    });
    this.active.add(worker);
    try {
      return await new Promise<DecodedImport>((resolve, reject) => {
        const timer = setTimeout(
          () => done(new AppError(422, "PARSER_TIMEOUT")),
          this.deadline,
        );
        const aborted = () => done(new AppError(408, "UPLOAD_ABORTED"));
        let finished = false;
        function done(error?: Error, result?: DecodedImport) {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          signal?.removeEventListener("abort", aborted);
          if (error) reject(error);
          else resolve(result!);
        }
        signal?.addEventListener("abort", aborted, { once: true });
        worker.once("message", (message) =>
          message.ok
            ? done(undefined, message.result)
            : done(new AppError(422, message.code)),
        );
        worker.once("error", () => done(new AppError(422, "INVALID_INPUT")));
        worker.once("exit", () => done(new AppError(422, "INVALID_INPUT")));
      });
    } finally {
      await worker.terminate();
      this.active.delete(worker);
    }
  }
  async close() {
    await Promise.all([...this.active].map((w) => w.terminate()));
    this.active.clear();
  }
}
