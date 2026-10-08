import type {
  CandidateProfile,
  CandidateSummary,
  Feedback,
  FeedbackPayload,
  Meeting,
  MeetingFilters,
  MeetingPayload,
  Paginated,
  User,
} from "../types";
import { apiRequest } from "./client";

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),
  guest: () => apiRequest<AuthResponse>("/auth/guest", { method: "POST" }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};

export interface MeetingListParams extends Partial<MeetingFilters> {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export const meetingsApi = {
  list: (params: MeetingListParams, signal?: AbortSignal) =>
    apiRequest<Paginated<Meeting>>("/meetings", { query: { ...params }, signal }),
  get: (id: string) => apiRequest<Meeting>(`/meetings/${id}`),
  create: (payload: MeetingPayload) => apiRequest<Meeting>("/meetings", { method: "POST", body: payload }),
  update: (id: string, payload: Partial<MeetingPayload>) =>
    apiRequest<Meeting>(`/meetings/${id}`, { method: "PATCH", body: payload }),
  remove: (id: string) => apiRequest<void>(`/meetings/${id}`, { method: "DELETE" }),
};

export const candidatesApi = {
  search: (search: string, signal?: AbortSignal) =>
    apiRequest<{ data: CandidateSummary[] }>("/candidates", { query: { search }, signal }).then((r) => r.data),
  get: (id: string) => apiRequest<CandidateProfile>(`/candidates/${id}`),
  updateNotes: (id: string, interviewNotes: string) =>
    apiRequest<CandidateProfile>(`/candidates/${id}/notes`, { method: "PATCH", body: { interviewNotes } }),
  addFeedback: (id: string, payload: FeedbackPayload) =>
    apiRequest<Feedback>(`/candidates/${id}/feedback`, { method: "POST", body: payload }),
};
