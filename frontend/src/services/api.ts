import type { AuthMeResponse } from "@/types/database";
import type { BackendHealthResponse } from "@/types/health";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 10000;

export function getApiBaseUrl(): string {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const configured = rawApiUrl ? rawApiUrl.trim() : "";
  return (configured.length > 0 ? configured : DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    ""
  );
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string; timeoutMs?: number }
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const { accessToken, timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchInit } =
    init ?? {};

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchInit,
      signal: fetchInit.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(fetchInit.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ApiError(
        body || `Backend request failed with HTTP ${response.status}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        `Request to SkillPilot backend (${url}) timed out after ${timeoutMs / 1000}s.`,
        504
      );
    }
    throw new ApiError(
      err instanceof Error
        ? `Network error reaching SkillPilot backend: ${err.message}`
        : "Network error reaching SkillPilot backend.",
      0
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function fetchBackendHealth(): Promise<BackendHealthResponse> {
  return apiFetch<BackendHealthResponse>("/api/v1/health");
}

export async function fetchAuthenticatedMe(
  accessToken: string
): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>("/api/v1/auth/me", { accessToken });
}

export async function fetchManagerCheck(
  accessToken: string
): Promise<{ status: string; user_id: string; message: string }> {
  return apiFetch<{ status: string; user_id: string; message: string }>(
    "/api/v1/auth/manager-check",
    { accessToken }
  );
}
