export const POSITIONS = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'QA Engineer',
  'Product Designer',
  'Product Manager',
  'Data Engineer',
] as const;
export type Position = (typeof POSITIONS)[number];

export interface CandidateSummary {
  id: string;
  name: string;
  position: string;
}

export interface Candidate extends CandidateSummary {
  email: string | null;
  interviewNotes: string;
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

export type FeedbackWrite = Omit<Feedback, 'id' | 'createdAt'>;
