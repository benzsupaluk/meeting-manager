import { describe, expect, it } from 'vitest';
import { NotFoundError, ValidationError } from '../src/domain/errors.js';
import { createMemoryRepositories } from '../src/repositories/memory/index.js';
import { MeetingService } from '../src/services/meeting.service.js';
import { hoursFromNow } from './helpers.js';

const setup = () => {
  const repos = createMemoryRepositories();
  return { repos, service: new MeetingService(repos.meetings, repos.candidates) };
};

const base = {
  candidateName: 'Alice',
  position: 'Software Engineer',
  startAt: hoursFromNow(24),
  endAt: hoursFromNow(25),
  type: 'zoom' as const,
};

describe('MeetingService', () => {
  it('creates a meeting with sensible defaults and reuses candidates', async () => {
    const { service } = setup();
    const first = await service.create(base);
    const second = await service.create({ ...base, candidateName: '  alice ' });

    expect(first.title).toBe('Software Engineer Interview');
    expect(first.status).toBe('pending');
    expect(second.candidate.id).toBe(first.candidate.id);
  });

  it('rejects an end time before the start time', async () => {
    const { service } = setup();
    await expect(service.create({ ...base, endAt: hoursFromNow(23) })).rejects.toBeInstanceOf(ValidationError);
  });

  it('validates the merged time range on partial update', async () => {
    const { service } = setup();
    const meeting = await service.create(base);
    await expect(service.update(meeting.id, { endAt: hoursFromNow(1) })).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates only provided fields', async () => {
    const { service } = setup();
    const meeting = await service.create({ ...base, description: 'keep me' });
    const updated = await service.update(meeting.id, { status: 'confirmed' });
    expect(updated).toMatchObject({ status: 'confirmed', description: 'keep me', startAt: meeting.startAt });
  });

  it('splits upcoming and past meetings and paginates', async () => {
    const { service } = setup();
    for (let i = 1; i <= 5; i++) {
      await service.create({ ...base, startAt: hoursFromNow(i), endAt: hoursFromNow(i + 0.5) });
    }
    await service.create({ ...base, startAt: hoursFromNow(-5), endAt: hoursFromNow(-4) });

    const page1 = await service.list({ page: 1, limit: 2, scope: 'upcoming' });
    const page3 = await service.list({ page: 3, limit: 2, scope: 'upcoming' });
    const past = await service.list({ page: 1, limit: 10, scope: 'past' });

    expect(page1.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3, hasMore: true });
    expect(page1.data[0]!.startAt < page1.data[1]!.startAt).toBe(true);
    expect(page3.meta.hasMore).toBe(false);
    expect(past.meta.total).toBe(1);
  });

  it('throws NotFound when deleting a missing meeting', async () => {
    const { service } = setup();
    await expect(service.delete('00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('MeetingService date range', () => {
  it('filters by from/to on startAt', async () => {
    const { service } = setup();
    await service.create({ ...base, startAt: hoursFromNow(1), endAt: hoursFromNow(2) });
    await service.create({ ...base, startAt: hoursFromNow(48), endAt: hoursFromNow(49) });
    const res = await service.list({
      page: 1,
      limit: 10,
      scope: 'all',
      from: new Date(),
      to: new Date(Date.now() + 24 * 3_600_000),
    });
    expect(res.meta.total).toBe(1);
  });
});
