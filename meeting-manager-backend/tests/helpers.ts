import request from 'supertest';
import { createApp } from '../src/app.js';
import { createServices } from '../src/container.js';
import { DEMO_USER, seedDemoData } from '../src/db/seed.js';
import { createMemoryRepositories } from '../src/repositories/memory/index.js';

export async function buildTestApp({ seed = true } = {}) {
  const repos = createMemoryRepositories();
  if (seed) await seedDemoData(repos);
  const services = createServices(repos, { JWT_SECRET: 'test-secret-123', JWT_EXPIRES_IN: '1h' });
  const app = createApp(services);
  const login = await request(app).post('/api/auth/login').send(DEMO_USER);
  return { app, repos, services, token: login.body.token as string };
}

export const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
