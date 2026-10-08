import { z } from 'zod';
import { MEETING_STATUSES, MEETING_TYPES } from '../domain/meeting.js';

const isoDate = z.iso.datetime({ offset: true });

export const LoginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(255),
});

export const MeetingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  scope: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  status: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : undefined))
    .pipe(z.array(z.enum(MEETING_STATUSES)).optional()),
  candidateId: z.uuid().optional(),
  search: z.string().trim().max(100).optional(),
  from: isoDate.transform((v) => new Date(v)).optional(),
  to: isoDate.transform((v) => new Date(v)).optional(),
});

const meetingFields = {
  title: z.string().trim().max(200).optional(),
  description: z.string().max(5000).optional(),
  candidateId: z.uuid().optional(),
  candidateName: z.string().trim().min(1).max(120).optional(),
  position: z.string().trim().min(1).max(120).optional(),
  startAt: isoDate,
  endAt: isoDate,
  type: z.enum(MEETING_TYPES),
  location: z.string().trim().max(500).optional(),
  status: z.enum(MEETING_STATUSES).optional(),
};

export const CreateMeetingSchema = z
  .object(meetingFields)
  .refine((v) => v.candidateId || (v.candidateName && v.position), {
    message: 'Provide candidateId or candidateName + position',
    path: ['candidateName'],
  });

export const UpdateMeetingSchema = z
  .object(meetingFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

export const IdParamSchema = z.object({ id: z.uuid() });

export const CandidateSearchSchema = z.object({
  search: z.string().trim().max(100).default(''),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const UpdateNotesSchema = z.object({ interviewNotes: z.string().max(10000) });

export const FeedbackSchema = z.object({
  meetingId: z.uuid().nullish(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(5000),
});
