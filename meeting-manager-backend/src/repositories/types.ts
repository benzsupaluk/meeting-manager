import type { Candidate, CandidateSummary, Feedback, FeedbackWrite } from '../domain/candidate.js';
import type { Meeting, MeetingQuery, MeetingWrite } from '../domain/meeting.js';
import type { User } from '../domain/user.js';

export interface MeetingRepository {
  list(query: MeetingQuery): Promise<{ items: Meeting[]; total: number }>;
  findById(id: string): Promise<Meeting | null>;
  create(input: MeetingWrite): Promise<Meeting>;
  update(id: string, input: MeetingWrite): Promise<Meeting | null>;
  delete(id: string): Promise<boolean>;
}

export interface CandidateRepository {
  search(term: string, limit: number): Promise<CandidateSummary[]>;
  findById(id: string): Promise<Candidate | null>;
  /** Returns the existing candidate with the same name + position, or creates one. */
  findOrCreate(name: string, position: string): Promise<Candidate>;
  updateNotes(id: string, interviewNotes: string): Promise<Candidate | null>;
  listFeedback(candidateId: string): Promise<Feedback[]>;
  addFeedback(input: FeedbackWrite): Promise<Feedback>;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: Omit<User, 'id'>): Promise<User>;
}

export interface Repositories {
  meetings: MeetingRepository;
  candidates: CandidateRepository;
  users: UserRepository;
  /** Releases underlying resources (e.g. pg pool). */
  close(): Promise<void>;
}
