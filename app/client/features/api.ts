export interface User {
  id: string;
  name: string;
  email: string;
}
export interface Workspace {
  id: string;
  name: string;
  role: "owner" | "member";
}
export interface Member {
  userId: string;
  name: string;
  role: "owner" | "member";
}
export class RequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new RequestError(
      response.status,
      typeof result.code === "string" ? result.code : "REQUEST_FAILED",
    );
  return result as T;
}
