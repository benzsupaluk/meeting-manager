import { NotFoundError } from '../domain/errors.js';
import type { Candidate, Feedback } from '../domain/candidate.js';
import type { Meeting } from '../domain/meeting.js';
import type { CandidateRepository, MeetingRepository } from '../repositories/types.js';

export interface CandidateProfile extends Candidate {
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
  feedback: Feedback[];
}

const HISTORY_LIMIT = 50;

export class CandidateService {
  constructor(
    private readonly candidates: CandidateRepository,
    private readonly meetings: MeetingRepository,
  ) {}

  search(term: string, limit = 8) {
    return this.candidates.search(term, limit);
  }

  async getProfile(id: string): Promise<CandidateProfile> {
    const candidate = await this.candidates.findById(id);
    if (!candidate) throw new NotFoundError('Candidate');

    const base = { page: 1, limit: HISTORY_LIMIT, candidateId: id };
    const [upcoming, past, feedback] = await Promise.all([
      this.meetings.list({ ...base, scope: 'upcoming' }),
      this.meetings.list({ ...base, scope: 'past' }),
      this.candidates.listFeedback(id),
    ]);
    return { ...candidate, upcomingMeetings: upcoming.items, pastMeetings: past.items, feedback };
  }

  async updateNotes(id: string, interviewNotes: string) {
    const updated = await this.candidates.updateNotes(id, interviewNotes);
    if (!updated) throw new NotFoundError('Candidate');
    return updated;
  }

  async addFeedback(
    candidateId: string,
    input: { meetingId?: string | null; rating: number; comment: string },
    authorName: string,
  ) {
    if (!(await this.candidates.findById(candidateId))) throw new NotFoundError('Candidate');
    if (input.meetingId) {
      const meeting = await this.meetings.findById(input.meetingId);
      if (!meeting || meeting.candidate.id !== candidateId) throw new NotFoundError('Meeting');
    }
    return this.candidates.addFeedback({
      candidateId,
      meetingId: input.meetingId ?? null,
      authorName,
      rating: input.rating,
      comment: input.comment,
    });
  }
}
