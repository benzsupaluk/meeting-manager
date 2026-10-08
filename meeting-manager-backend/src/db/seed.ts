import type { MeetingStatus, MeetingType } from '../domain/meeting.js';
import type { Repositories } from '../repositories/types.js';
import { AuthService, GUEST_EMAIL } from '../services/auth.service.js';

export const DEMO_USER = { email: 'recruiter@example.com', password: 'password123', name: 'Riley Recruiter' };

const DEMO_MEETINGS: {
  name: string;
  position: string;
  dayOffset: number;
  hour: number;
  duration: number;
  type: MeetingType;
  location: string;
  status: MeetingStatus;
  description: string;
}[] = [
  { name: 'Alice Johnson', position: 'Software Engineer', dayOffset: 0, hour: 10, duration: 60, type: 'zoom', location: 'https://zoom.us/j/1234567890', status: 'confirmed', description: 'Technical screen: data structures & system design basics.' },
  { name: 'Ben Carter', position: 'Frontend Engineer', dayOffset: 0, hour: 14, duration: 45, type: 'google_meet', location: 'https://meet.google.com/abc-defg-hij', status: 'pending', description: 'Portfolio walkthrough and React deep dive.' },
  { name: 'Chloe Nguyen', position: 'Backend Engineer', dayOffset: 1, hour: 9, duration: 90, type: 'onsite', location: 'Conference Room A', status: 'confirmed', description: 'Onsite loop: API design + pairing session.' },
  { name: 'Daniel Kim', position: 'DevOps Engineer', dayOffset: 2, hour: 11, duration: 60, type: 'zoom', location: 'https://zoom.us/j/9876543210', status: 'pending', description: 'Infra & CI/CD discussion.' },
  { name: 'Emma Rossi', position: 'Product Designer', dayOffset: 3, hour: 13, duration: 60, type: 'onsite', location: 'Design Studio', status: 'confirmed', description: 'Design critique & case study presentation.' },
  { name: 'Farah Ali', position: 'Full Stack Engineer', dayOffset: 4, hour: 15, duration: 60, type: 'google_meet', location: 'https://meet.google.com/xyz-abcd-efg', status: 'pending', description: 'Take-home review.' },
  { name: 'George Park', position: 'QA Engineer', dayOffset: 5, hour: 10, duration: 45, type: 'zoom', location: 'https://zoom.us/j/5550001111', status: 'confirmed', description: 'Testing strategy interview.' },
  { name: 'Hana Sato', position: 'Data Engineer', dayOffset: 6, hour: 16, duration: 60, type: 'onsite', location: 'Conference Room B', status: 'pending', description: 'SQL & pipeline design.' },
  { name: 'Ivan Petrov', position: 'Software Engineer', dayOffset: 8, hour: 9, duration: 60, type: 'zoom', location: 'https://zoom.us/j/2223334444', status: 'pending', description: 'Initial technical screen.' },
  { name: 'Julia Santos', position: 'Product Manager', dayOffset: 9, hour: 14, duration: 60, type: 'google_meet', location: 'https://meet.google.com/pqr-stuv-wxy', status: 'confirmed', description: 'Product sense interview.' },
  { name: 'Kevin Brown', position: 'Backend Engineer', dayOffset: 11, hour: 11, duration: 60, type: 'onsite', location: 'Conference Room A', status: 'pending', description: 'System design round.' },
  { name: 'Alice Johnson', position: 'Software Engineer', dayOffset: -7, hour: 10, duration: 30, type: 'zoom', location: 'https://zoom.us/j/1234567890', status: 'completed', description: 'Recruiter intro call.' },
  { name: 'Chloe Nguyen', position: 'Backend Engineer', dayOffset: -5, hour: 15, duration: 60, type: 'google_meet', location: 'https://meet.google.com/abc-defg-hij', status: 'completed', description: 'Phone screen with hiring manager.' },
];

/** Idempotent: only seeds when there are no users yet. */
export async function seedDemoData(repos: Repositories) {
  if (await repos.users.findByEmail(DEMO_USER.email)) return;

  await repos.users.create({
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    passwordHash: await AuthService.hashPassword(DEMO_USER.password),
  });
  await repos.users.create({
    email: GUEST_EMAIL,
    name: 'Guest',
    passwordHash: await AuthService.hashPassword(crypto.randomUUID()),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const m of DEMO_MEETINGS) {
    const candidate = await repos.candidates.findOrCreate(m.name, m.position);
    const start = new Date(today);
    start.setDate(start.getDate() + m.dayOffset);
    start.setHours(m.hour);
    const end = new Date(start.getTime() + m.duration * 60_000);
    await repos.meetings.create({
      title: `${m.position} Interview`,
      description: m.description,
      candidateId: candidate.id,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      type: m.type,
      location: m.location,
      status: m.status,
    });
  }

  const alice = await repos.candidates.findOrCreate('Alice Johnson', 'Software Engineer');
  await repos.candidates.updateNotes(alice.id, 'Strong fundamentals. Ask about distributed systems experience.');
  await repos.candidates.addFeedback({
    candidateId: alice.id,
    meetingId: null,
    authorName: DEMO_USER.name,
    rating: 4,
    comment: 'Great communication during intro call. Motivated and well-prepared.',
  });
  console.log('[seed] demo data inserted');
}
