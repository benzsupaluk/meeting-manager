export type MeetingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type MeetingType = "onsite" | "zoom" | "google_meet";
export type MeetingScope = "upcoming" | "past" | "all";

export type UserRole = "member" | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface MeetingCreator {
  id: string;
  name: string;
  email: string;
}

export interface CandidateSummary {
  id: string;
  name: string;
  position: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  candidate: CandidateSummary;
  startAt: string;
  endAt: string;
  type: MeetingType;
  location: string;
  status: MeetingStatus;
  /** Null for meetings booked before creators were tracked. */
  createdBy: MeetingCreator | null;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  candidateId: string;
  meetingId: string | null;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CandidateProfile extends CandidateSummary {
  email: string | null;
  interviewNotes: string;
  createdAt: string;
  updatedAt: string;
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
  feedback: Feedback[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface MeetingFilters {
  scope: MeetingScope;
  status?: MeetingStatus;
  search?: string;
}

export interface MeetingPayload {
  title?: string;
  description?: string;
  candidateId?: string;
  candidateName?: string;
  position?: string;
  startAt: string;
  endAt: string;
  type: MeetingType;
  location?: string;
  status?: MeetingStatus;
}

export interface FeedbackPayload {
  meetingId?: string | null;
  rating: number;
  comment: string;
}
