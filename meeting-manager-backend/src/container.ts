import type { Env } from './config/env.js';
import { seedDemoData } from './db/seed.js';
import { createMemoryRepositories } from './repositories/memory/index.js';
import { createPostgresRepositories } from './repositories/postgres/index.js';
import type { Repositories } from './repositories/types.js';
import { AuthService } from './services/auth.service.js';
import { CandidateService } from './services/candidate.service.js';
import { MeetingService } from './services/meeting.service.js';

export interface Services {
  auth: AuthService;
  meetings: MeetingService;
  candidates: CandidateService;
}

export const createServices = (repos: Repositories, env: Pick<Env, 'JWT_SECRET' | 'JWT_EXPIRES_IN'>): Services => ({
  auth: new AuthService(repos.users, { jwtSecret: env.JWT_SECRET, jwtExpiresIn: env.JWT_EXPIRES_IN }),
  meetings: new MeetingService(repos.meetings, repos.candidates),
  candidates: new CandidateService(repos.candidates, repos.meetings),
});

/** Composition root: picks the persistence driver, seeds, and wires services. */
export async function createContainer(env: Env) {
  const repos =
    env.DB_DRIVER === 'memory' ? createMemoryRepositories() : await createPostgresRepositories(env.DATABASE_URL);
  if (env.SEED_DEMO_DATA) await seedDemoData(repos);
  return { repos, services: createServices(repos, env) };
}
