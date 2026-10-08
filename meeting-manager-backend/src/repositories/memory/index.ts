import { randomUUID } from 'node:crypto';
import type { Candidate, Feedback } from '../../domain/candidate.js';
import type { Meeting, MeetingQuery, MeetingWrite } from '../../domain/meeting.js';
import type { User } from '../../domain/user.js';
import type {
  CandidateRepository,
  MeetingRepository,
  Repositories,
  UserRepository,
} from '../types.js';

const now = () => new Date().toISOString();
const sameKey = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

class InMemoryCandidateRepository implements CandidateRepository {
  readonly candidates = new Map<string, Candidate>();
  private readonly feedback: Feedback[] = [];

  async search(term: string, limit: number) {
    const q = term.trim().toLowerCase();
    return [...this.candidates.values()]
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map(({ id, name, position }) => ({ id, name, position }));
  }

  async findById(id: string) {
    return this.candidates.get(id) ?? null;
  }

  async findOrCreate(name: string, position: string) {
    const existing = [...this.candidates.values()].find(
      (c) => sameKey(c.name, name) && c.position === position,
    );
    if (existing) return existing;
    const ts = now();
    const candidate: Candidate = {
      id: randomUUID(),
      name: name.trim(),
      position,
      email: null,
      interviewNotes: '',
      createdAt: ts,
      updatedAt: ts,
    };
    this.candidates.set(candidate.id, candidate);
    return candidate;
  }

  async updateNotes(id: string, interviewNotes: string) {
    const candidate = this.candidates.get(id);
    if (!candidate) return null;
    const updated = { ...candidate, interviewNotes, updatedAt: now() };
    this.candidates.set(id, updated);
    return updated;
  }

  async listFeedback(candidateId: string) {
    return this.feedback
      .filter((f) => f.candidateId === candidateId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addFeedback(input: Omit<Feedback, 'id' | 'createdAt'>) {
    const fb: Feedback = { ...input, id: randomUUID(), createdAt: now() };
    this.feedback.push(fb);
    return fb;
  }
}

type StoredMeeting = MeetingWrite & { id: string; createdAt: string; updatedAt: string };

class InMemoryMeetingRepository implements MeetingRepository {
  private readonly meetings = new Map<string, StoredMeeting>();

  constructor(private readonly candidates: InMemoryCandidateRepository) {}

  private hydrate({ candidateId, ...m }: StoredMeeting): Meeting {
    const c = this.candidates.candidates.get(candidateId);
    return {
      ...m,
      candidate: { id: candidateId, name: c?.name ?? 'Unknown', position: c?.position ?? '' },
    };
  }

  async list(query: MeetingQuery) {
    const ref = (query.now ?? new Date()).toISOString();
    const search = query.search?.toLowerCase();
    const filtered = [...this.meetings.values()]
      .map((m) => this.hydrate(m))
      .filter((m) => {
        if (query.scope === 'upcoming' && m.endAt < ref) return false;
        if (query.scope === 'past' && m.endAt >= ref) return false;
        if (query.statuses?.length && !query.statuses.includes(m.status)) return false;
        if (query.from && m.startAt < query.from.toISOString()) return false;
        if (query.to && m.startAt >= query.to.toISOString()) return false;
        if (query.candidateId && m.candidate.id !== query.candidateId) return false;
        if (
          search &&
          !m.title.toLowerCase().includes(search) &&
          !m.candidate.name.toLowerCase().includes(search)
        )
          return false;
        return true;
      })
      .sort((a, b) =>
        query.scope === 'past' ? b.startAt.localeCompare(a.startAt) : a.startAt.localeCompare(b.startAt),
      );
    const offset = (query.page - 1) * query.limit;
    return { items: filtered.slice(offset, offset + query.limit), total: filtered.length };
  }

  async findById(id: string) {
    const m = this.meetings.get(id);
    return m ? this.hydrate(m) : null;
  }

  async create(input: MeetingWrite) {
    const ts = now();
    const stored: StoredMeeting = { ...input, id: randomUUID(), createdAt: ts, updatedAt: ts };
    this.meetings.set(stored.id, stored);
    return this.hydrate(stored);
  }

  async update(id: string, input: MeetingWrite) {
    const existing = this.meetings.get(id);
    if (!existing) return null;
    const stored: StoredMeeting = { ...existing, ...input, updatedAt: now() };
    this.meetings.set(id, stored);
    return this.hydrate(stored);
  }

  async delete(id: string) {
    return this.meetings.delete(id);
  }
}

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => sameKey(u.email, email)) ?? null;
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async create(input: Omit<User, 'id'>) {
    const user: User = { ...input, id: randomUUID() };
    this.users.set(user.id, user);
    return user;
  }
}

export const createMemoryRepositories = (): Repositories => {
  const candidates = new InMemoryCandidateRepository();
  return {
    candidates,
    meetings: new InMemoryMeetingRepository(candidates),
    users: new InMemoryUserRepository(),
    close: async () => {},
  };
};
