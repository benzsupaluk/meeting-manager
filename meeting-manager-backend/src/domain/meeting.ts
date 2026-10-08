import type { CandidateSummary } from './candidate.js';

export const MEETING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_TYPES = ['onsite', 'zoom', 'google_meet'] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

/** Who booked the meeting; null for legacy rows or deleted users. */
export interface MeetingCreator {
  id: string;
  name: string;
  email: string;
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
  createdBy: MeetingCreator | null;
  createdAt: string;
  updatedAt: string;
}

/** Persistence-level shape: candidate is referenced by id. */
export interface MeetingWrite {
  title: string;
  description: string;
  candidateId: string;
  startAt: string;
  endAt: string;
  type: MeetingType;
  location: string;
  status: MeetingStatus;
}

export type MeetingScope = 'upcoming' | 'past' | 'all';

export interface MeetingQuery {
  page: number;
  limit: number;
  scope: MeetingScope;
  statuses?: MeetingStatus[];
  candidateId?: string;
  search?: string;
  /** Inclusive lower bound on startAt. */
  from?: Date;
  /** Exclusive upper bound on startAt. */
  to?: Date;
  /** Reference "now" used to split upcoming/past; injectable for tests. */
  now?: Date;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

export const paginate = <T>(data: T[], total: number, page: number, limit: number): Paginated<T> => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { data, meta: { page, limit, total, totalPages, hasMore: page < totalPages } };
};
