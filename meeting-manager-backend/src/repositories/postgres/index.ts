import pg from 'pg';
import type { Candidate, CandidateSummary, Feedback, FeedbackWrite } from '../../domain/candidate.js';
import type { Meeting, MeetingQuery, MeetingWrite } from '../../domain/meeting.js';
import type { User } from '../../domain/user.js';
import { runMigrations } from '../../db/migrations.js';
import type {
  CandidateRepository,
  MeetingRepository,
  Repositories,
  UserRepository,
} from '../types.js';

const iso = (d: Date) => d.toISOString();

// ---------- Meetings ----------

interface MeetingRow {
  id: string;
  title: string;
  description: string;
  candidate_id: string;
  candidate_name: string;
  candidate_position: string;
  start_at: Date;
  end_at: Date;
  type: Meeting['type'];
  location: string;
  status: Meeting['status'];
  created_at: Date;
  updated_at: Date;
}

const toMeeting = (r: MeetingRow): Meeting => ({
  id: r.id,
  title: r.title,
  description: r.description,
  candidate: { id: r.candidate_id, name: r.candidate_name, position: r.candidate_position },
  startAt: iso(r.start_at),
  endAt: iso(r.end_at),
  type: r.type,
  location: r.location,
  status: r.status,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

const MEETING_SELECT = `
  SELECT m.*, c.name AS candidate_name, c.position AS candidate_position
  FROM meetings m JOIN candidates c ON c.id = m.candidate_id`;

class PgMeetingRepository implements MeetingRepository {
  constructor(private readonly pool: pg.Pool) {}

  async list(query: MeetingQuery) {
    const where: string[] = [];
    const params: unknown[] = [];
    const bind = (value: unknown) => `$${params.push(value)}`;

    if (query.scope !== 'all') {
      const ref = bind(query.now ?? new Date());
      where.push(query.scope === 'upcoming' ? `m.end_at >= ${ref}` : `m.end_at < ${ref}`);
    }
    if (query.statuses?.length) where.push(`m.status = ANY(${bind(query.statuses)})`);
    if (query.candidateId) where.push(`m.candidate_id = ${bind(query.candidateId)}`);
    if (query.from) where.push(`m.start_at >= ${bind(query.from)}`);
    if (query.to) where.push(`m.start_at < ${bind(query.to)}`);
    if (query.search) {
      const term = bind(`%${query.search}%`);
      where.push(`(m.title ILIKE ${term} OR c.name ILIKE ${term})`);
    }

    const order = query.scope === 'past' ? 'DESC' : 'ASC';
    const sql = `
      SELECT m.*, c.name AS candidate_name, c.position AS candidate_position,
             COUNT(*) OVER()::int AS total_count
      FROM meetings m JOIN candidates c ON c.id = m.candidate_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY m.start_at ${order}, m.id
      LIMIT ${bind(query.limit)} OFFSET ${bind((query.page - 1) * query.limit)}`;

    const { rows } = await this.pool.query<MeetingRow & { total_count: number }>(sql, params);
    // COUNT(*) OVER() is absent when the page is empty; fall back to a cheap count.
    const total = rows[0]?.total_count ?? (query.page > 1 ? await this.count(where, params) : 0);
    return { items: rows.map(toMeeting), total };
  }

  private async count(where: string[], params: unknown[]) {
    const { rows } = await this.pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM meetings m JOIN candidates c ON c.id = m.candidate_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      params.slice(0, -2),
    );
    return rows[0]?.count ?? 0;
  }

  async findById(id: string) {
    const { rows } = await this.pool.query<MeetingRow>(`${MEETING_SELECT} WHERE m.id = $1`, [id]);
    return rows[0] ? toMeeting(rows[0]) : null;
  }

  async create(input: MeetingWrite) {
    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO meetings (candidate_id, title, description, start_at, end_at, type, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        input.candidateId,
        input.title,
        input.description,
        input.startAt,
        input.endAt,
        input.type,
        input.location,
        input.status,
      ],
    );
    return (await this.findById(rows[0]!.id))!;
  }

  async update(id: string, input: MeetingWrite) {
    const { rowCount } = await this.pool.query(
      `UPDATE meetings SET candidate_id = $2, title = $3, description = $4, start_at = $5,
         end_at = $6, type = $7, location = $8, status = $9, updated_at = now()
       WHERE id = $1`,
      [
        id,
        input.candidateId,
        input.title,
        input.description,
        input.startAt,
        input.endAt,
        input.type,
        input.location,
        input.status,
      ],
    );
    return rowCount ? this.findById(id) : null;
  }

  async delete(id: string) {
    const { rowCount } = await this.pool.query('DELETE FROM meetings WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}

// ---------- Candidates ----------

interface CandidateRow {
  id: string;
  name: string;
  position: string;
  email: string | null;
  interview_notes: string;
  created_at: Date;
  updated_at: Date;
}

const toCandidate = (r: CandidateRow): Candidate => ({
  id: r.id,
  name: r.name,
  position: r.position,
  email: r.email,
  interviewNotes: r.interview_notes,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

interface FeedbackRow {
  id: string;
  candidate_id: string;
  meeting_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: Date;
}

const toFeedback = (r: FeedbackRow): Feedback => ({
  id: r.id,
  candidateId: r.candidate_id,
  meetingId: r.meeting_id,
  authorName: r.author_name,
  rating: r.rating,
  comment: r.comment,
  createdAt: iso(r.created_at),
});

class PgCandidateRepository implements CandidateRepository {
  constructor(private readonly pool: pg.Pool) {}

  async search(term: string, limit: number): Promise<CandidateSummary[]> {
    const { rows } = await this.pool.query<CandidateSummary>(
      'SELECT id, name, position FROM candidates WHERE name ILIKE $1 ORDER BY name LIMIT $2',
      [`%${term}%`, limit],
    );
    return rows;
  }

  async findById(id: string) {
    const { rows } = await this.pool.query<CandidateRow>('SELECT * FROM candidates WHERE id = $1', [id]);
    return rows[0] ? toCandidate(rows[0]) : null;
  }

  async findOrCreate(name: string, position: string) {
    // Upsert keeps this race-free under concurrent bookings for the same candidate.
    const { rows } = await this.pool.query<CandidateRow>(
      `INSERT INTO candidates (name, position) VALUES ($1, $2)
       ON CONFLICT (lower(name), position) DO UPDATE SET name = candidates.name
       RETURNING *`,
      [name.trim(), position],
    );
    return toCandidate(rows[0]!);
  }

  async updateNotes(id: string, interviewNotes: string) {
    const { rows } = await this.pool.query<CandidateRow>(
      'UPDATE candidates SET interview_notes = $2, updated_at = now() WHERE id = $1 RETURNING *',
      [id, interviewNotes],
    );
    return rows[0] ? toCandidate(rows[0]) : null;
  }

  async listFeedback(candidateId: string) {
    const { rows } = await this.pool.query<FeedbackRow>(
      'SELECT * FROM feedback WHERE candidate_id = $1 ORDER BY created_at DESC',
      [candidateId],
    );
    return rows.map(toFeedback);
  }

  async addFeedback(input: FeedbackWrite) {
    const { rows } = await this.pool.query<FeedbackRow>(
      `INSERT INTO feedback (candidate_id, meeting_id, author_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.candidateId, input.meetingId, input.authorName, input.rating, input.comment],
    );
    return toFeedback(rows[0]!);
  }
}

// ---------- Users ----------

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  passwordHash: r.password_hash,
});

class PgUserRepository implements UserRepository {
  constructor(private readonly pool: pg.Pool) {}

  async findByEmail(email: string) {
    const { rows } = await this.pool.query<UserRow>('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findById(id: string) {
    const { rows } = await this.pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async create(input: Omit<User, 'id'>) {
    const { rows } = await this.pool.query<UserRow>(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [input.email, input.name, input.passwordHash],
    );
    return toUser(rows[0]!);
  }
}

export const createPostgresRepositories = async (connectionString: string): Promise<Repositories> => {
  const pool = new pg.Pool({ connectionString, max: 10 });
  await runMigrations(pool);
  return {
    meetings: new PgMeetingRepository(pool),
    candidates: new PgCandidateRepository(pool),
    users: new PgUserRepository(pool),
    close: () => pool.end(),
  };
};
