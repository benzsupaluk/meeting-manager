export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type TokenProvider = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenProvider = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

/** Wired once by the auth store, keeping this module free of store imports (no cycles). */
export function configureApiClient(config: { getToken: TokenProvider; onUnauthorized: UnauthorizedHandler }) {
  getToken = config.getToken;
  onUnauthorized = config.onUnauthorized;
}

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Query;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, { body, query, headers, ...init }: RequestOptions = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please check your connection.", 0, "NETWORK_ERROR");
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized();
    const error = payload?.error;
    throw new ApiError(error?.message ?? response.statusText, response.status, error?.code, error?.details);
  }
  return payload as T;
}

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";
