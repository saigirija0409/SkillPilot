import type {
  ManagerAnalyticsResponseDto,
  ManagerTeamMemberRowDto,
  RecommendationResponseDto,
  ResumeParseResponseDto,
  RoadmapDetailDto,
  RoadmapGenerateRequestDto,
  RoadmapGenerateResponseDto,
  RoadmapItemDto,
  RoadmapListItemDto,
  SkillExtractionResponseDto,
  SkillGapResponseDto,
} from "@/types/api";
import type { AuthMeResponse } from "@/types/database";
import type { BackendHealthResponse } from "@/types/health";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8001";
const DEFAULT_TIMEOUT_MS = 15000;

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

function extractReadableError(rawBody: string, status: number): string {
  if (!rawBody) {
    return `Backend request failed with HTTP ${status}`;
  }
  try {
    const parsed = JSON.parse(rawBody) as { detail?: unknown; message?: string };
    if (typeof parsed.detail === "string") {
      return parsed.detail;
    }
    if (typeof parsed.message === "string") {
      return parsed.message;
    }
  } catch {
    // plain text body
  }
  return rawBody;
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
      throw new ApiError(extractReadableError(body, response.status), response.status);
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

export async function apiUploadFormData<T>(
  path: string,
  formData: FormData,
  accessToken: string,
  timeoutMs = 30000
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ApiError(extractReadableError(body, response.status), response.status);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        `Resume parsing request timed out after ${timeoutMs / 1000}s.`,
        504
      );
    }
    throw new ApiError(
      err instanceof Error
        ? `Network error uploading to SkillPilot backend: ${err.message}`
        : "Network error uploading to SkillPilot backend.",
      0
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

// ---------------------------------------------------------------------------
// Health & Auth
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Resumes & Skill Extraction
// ---------------------------------------------------------------------------

export async function uploadAndParseResumeApi(
  file: File,
  accessToken: string
): Promise<ResumeParseResponseDto> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUploadFormData<ResumeParseResponseDto>(
    "/api/v1/resumes/upload",
    formData,
    accessToken
  );
}

export async function extractSkillsFromTextApi(
  text: string,
  targetRole: string | undefined,
  accessToken: string
): Promise<SkillExtractionResponseDto> {
  return apiFetch<SkillExtractionResponseDto>("/api/v1/resumes/extract", {
    method: "POST",
    accessToken,
    timeoutMs: 25000,
    body: JSON.stringify({
      text,
      target_role: targetRole || null,
    }),
  });
}

// ---------------------------------------------------------------------------
// Skill Gap & ML Recommendations
// ---------------------------------------------------------------------------

export async function fetchSkillGapApi(
  targetRoleId: string,
  accessToken: string
): Promise<SkillGapResponseDto> {
  return apiFetch<SkillGapResponseDto>(
    `/api/v1/skills/gap?target_role_id=${encodeURIComponent(targetRoleId)}`,
    { accessToken }
  );
}

export async function fetchMlRecommendationsApi(
  accessToken: string,
  options?: {
    targetRoleId?: string;
    limit?: number;
    maxCostInr?: number;
  }
): Promise<RecommendationResponseDto> {
  const params = new URLSearchParams();
  if (options?.targetRoleId) {
    params.set("target_role_id", options.targetRoleId);
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }
  if (options?.maxCostInr !== undefined) {
    params.set("max_cost_inr", String(options.maxCostInr));
  }
  const qs = params.toString();
  return apiFetch<RecommendationResponseDto>(
    `/api/v1/recommendations/opportunities${qs ? `?${qs}` : ""}`,
    { accessToken, timeoutMs: 45000 }
  );
}

// ---------------------------------------------------------------------------
// Personalized Gemini Roadmaps
// ---------------------------------------------------------------------------

export async function generateRoadmapApi(
  payload: RoadmapGenerateRequestDto,
  accessToken: string
): Promise<RoadmapGenerateResponseDto> {
  return apiFetch<RoadmapGenerateResponseDto>("/api/v1/roadmaps/generate", {
    method: "POST",
    accessToken,
    timeoutMs: 30000,
    body: JSON.stringify(payload),
  });
}

export async function listMyRoadmapsApi(
  accessToken: string
): Promise<RoadmapListItemDto[]> {
  return apiFetch<RoadmapListItemDto[]>("/api/v1/roadmaps/my", {
    accessToken,
  });
}

export async function getRoadmapDetailApi(
  roadmapId: string,
  accessToken: string
): Promise<RoadmapDetailDto> {
  return apiFetch<RoadmapDetailDto>(
    `/api/v1/roadmaps/${encodeURIComponent(roadmapId)}`,
    { accessToken }
  );
}

export async function updateRoadmapItemStatusApi(
  itemId: string,
  status: "pending" | "in_progress" | "completed" | "skipped",
  accessToken: string,
  notes?: string
): Promise<RoadmapItemDto> {
  return apiFetch<RoadmapItemDto>(
    `/api/v1/roadmaps/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      accessToken,
      body: JSON.stringify({
        item_id: itemId,
        status,
        notes: notes ?? null,
      }),
    }
  );
}

// ---------------------------------------------------------------------------
// Manager Workforce Intelligence
// ---------------------------------------------------------------------------

export async function fetchManagerAnalyticsApi(
  organizationId: string,
  accessToken: string,
  teamId?: string
): Promise<ManagerAnalyticsResponseDto> {
  const params = new URLSearchParams({ organization_id: organizationId });
  if (teamId) {
    params.set("team_id", teamId);
  }
  return apiFetch<ManagerAnalyticsResponseDto>(
    `/api/v1/manager/analytics?${params.toString()}`,
    { accessToken }
  );
}

export async function fetchManagerTeamMembersApi(
  organizationId: string,
  accessToken: string,
  teamId?: string
): Promise<ManagerTeamMemberRowDto[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  if (teamId) {
    params.set("team_id", teamId);
  }
  return apiFetch<ManagerTeamMemberRowDto[]>(
    `/api/v1/manager/team-members?${params.toString()}`,
    { accessToken }
  );
}
