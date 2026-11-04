import type { FastifyRequest } from "fastify";
import { AppError } from "../domain/model.js";
export class UploadAdmission {
  private actors = new Map<string, number>();
  private active = 0;
  get activeCount() {
    return this.active;
  }
  acquire(actor: string) {
    if ((this.actors.get(actor) ?? 0) >= 2)
      throw new AppError(429, "UPLOAD_BUSY");
    if (this.active >= 8) throw new AppError(503, "UPLOAD_BUSY");
    this.active++;
    this.actors.set(actor, (this.actors.get(actor) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      const n = (this.actors.get(actor) ?? 1) - 1;
      if (n) this.actors.set(actor, n);
      else this.actors.delete(actor);
    };
  }
}
export interface UploadContext {
  controller: AbortController;
  release: () => void;
  timer: ReturnType<typeof setTimeout>;
  buffer?: Buffer;
}
export const uploads = new WeakMap<FastifyRequest, UploadContext>();
export function releaseUpload(request: FastifyRequest) {
  const upload = uploads.get(request);
  if (!upload) return;
  uploads.delete(request);
  upload.controller.abort();
  clearTimeout(upload.timer);
  upload.buffer?.fill(0);
  upload.buffer = undefined;
  upload.release();
}
