import type { ZodType } from "zod";
import { ApiError, ContractError, NetworkError } from "./errors";

export interface TokenProvider {
  getAccessToken: () => string | null;
  /** Resolve a fresh access token, or null if the session cannot be refreshed. */
  refresh: () => Promise<string | null>;
  onSessionExpired: () => void;
}

interface RequestOptions<T> {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  schema: ZodType<T>;
  signal?: AbortSignal;
  /** Internal: set on the retry after a token refresh to avoid loops. */
  _retried?: boolean;
}

let tokens: TokenProvider | null = null;
let inflightRefresh: Promise<string | null> | null = null;

/** Wired once at startup so the API layer has no import dependency on the auth feature. */
export function configureApi(provider: TokenProvider) {
  tokens = provider;
}

/**
 * Single-flight refresh: when several requests hit 401 together they share one
 * refresh call instead of racing (a rotating refresh token would otherwise be
 * invalidated by the second call).
 */
function refreshOnce(): Promise<string | null> {
  inflightRefresh ??= (tokens?.refresh() ?? Promise.resolve(null)).finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const { method = "GET", body, schema, signal, _retried } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokens?.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new NetworkError(error);
  }

  if (response.status === 401 && !_retried && !path.startsWith("/auth/")) {
    const fresh = await refreshOnce();
    if (fresh) return request(path, { ...options, _retried: true });
    tokens?.onSessionExpired();
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
    } | null;
    throw new ApiError(response.status, problem?.message ?? response.statusText, problem?.code);
  }

  if (response.status === 204) return schema.parse(undefined);

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ContractError(path, parsed.error.message);
  return parsed.data;
}
