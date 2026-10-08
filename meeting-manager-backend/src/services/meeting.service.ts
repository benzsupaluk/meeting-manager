import { NotFoundError, ValidationError } from '../domain/errors.js';
import {
  paginate,
  type Meeting,
  type MeetingQuery,
  type MeetingStatus,
  type MeetingType,
  type MeetingWrite,
  type Paginated,
} from '../domain/meeting.js';
import type { CandidateRepository, MeetingRepository } from '../repositories/types.js';

export interface MeetingInput {
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

export type MeetingPatch = Partial<MeetingInput>;

export class MeetingService {
  constructor(
    private readonly meetings: MeetingRepository,
    private readonly candidates: CandidateRepository,
  ) {}

  async list(query: MeetingQuery): Promise<Paginated<Meeting>> {
    const { items, total } = await this.meetings.list(query);
    return paginate(items, total, query.page, query.limit);
  }

  async get(id: string): Promise<Meeting> {
    const meeting = await this.meetings.findById(id);
    if (!meeting) throw new NotFoundError('Meeting');
    return meeting;
  }

  async create(input: MeetingInput, createdById: string | null = null): Promise<Meeting> {
    const candidate = await this.resolveCandidate(input);
    const write: MeetingWrite = {
      title: input.title?.trim() || `${candidate.position} Interview`,
      description: input.description ?? '',
      candidateId: candidate.id,
      startAt: input.startAt,
      endAt: input.endAt,
      type: input.type,
      location: input.location ?? '',
      status: input.status ?? 'pending',
    };
    assertTimeRange(write);
    return this.meetings.create(write, createdById);
  }

  async update(id: string, patch: MeetingPatch): Promise<Meeting> {
    const current = await this.get(id);
    const candidateChanged = patch.candidateId || patch.candidateName || patch.position;
    const candidate = candidateChanged
      ? await this.resolveCandidate({
          candidateId: patch.candidateId,
          candidateName: patch.candidateName ?? current.candidate.name,
          position: patch.position ?? current.candidate.position,
        })
      : current.candidate;

    const write: MeetingWrite = {
      title: patch.title?.trim() || current.title,
      description: patch.description ?? current.description,
      candidateId: candidate.id,
      startAt: patch.startAt ?? current.startAt,
      endAt: patch.endAt ?? current.endAt,
      type: patch.type ?? current.type,
      location: patch.location ?? current.location,
      status: patch.status ?? current.status,
    };
    assertTimeRange(write);
    const updated = await this.meetings.update(id, write);
    if (!updated) throw new NotFoundError('Meeting');
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!(await this.meetings.delete(id))) throw new NotFoundError('Meeting');
  }

  private async resolveCandidate(input: Pick<MeetingInput, 'candidateId' | 'candidateName' | 'position'>) {
    if (input.candidateId) {
      const candidate = await this.candidates.findById(input.candidateId);
      if (!candidate) throw new NotFoundError('Candidate');
      return candidate;
    }
    if (!input.candidateName?.trim() || !input.position) {
      throw new ValidationError('Either candidateId or candidateName + position is required');
    }
    return this.candidates.findOrCreate(input.candidateName, input.position);
  }
}

function assertTimeRange({ startAt, endAt }: Pick<MeetingWrite, 'startAt' | 'endAt'>) {
  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new ValidationError('End time must be after start time', { field: 'endAt' });
  }
}
