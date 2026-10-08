import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp, hoursFromNow } from './helpers.js';

describe('Auth API', () => {
  it('rejects bad credentials and unauthenticated requests', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/auth/login').send({ email: 'recruiter@example.com', password: 'nope' });
    expect(res.status).toBe(401);
    expect((await request(app).get('/api/meetings')).status).toBe(401);
  });

  it('supports guest login', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/auth/guest');
    expect(res.status).toBe(200);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.body.user.name).toBe('Guest');
  });
});

describe('Meetings API', () => {
  it('performs full CRUD', async () => {
    const { app, token } = await buildTestApp({ seed: true });
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app)
      .post('/api/meetings')
      .set(auth)
      .send({
        candidateName: 'Zed Test',
        position: 'Backend Engineer',
        startAt: hoursFromNow(2),
        endAt: hoursFromNow(3),
        type: 'onsite',
        location: 'Room 1',
      });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const fetched = await request(app).get(`/api/meetings/${id}`).set(auth);
    expect(fetched.body.candidate.name).toBe('Zed Test');

    const updated = await request(app).patch(`/api/meetings/${id}`).set(auth).send({ status: 'confirmed' });
    expect(updated.body.status).toBe('confirmed');

    const filtered = await request(app).get('/api/meetings?search=zed&status=confirmed').set(auth);
    expect(filtered.body.data.map((m: { id: string }) => m.id)).toEqual([id]);

    expect((await request(app).delete(`/api/meetings/${id}`).set(auth)).status).toBe(204);
    expect((await request(app).get(`/api/meetings/${id}`).set(auth)).status).toBe(404);
  });

  it('returns field-level validation errors', async () => {
    const { app, token } = await buildTestApp();
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send({ startAt: 'not-a-date', type: 'carrier-pigeon' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(
      expect.arrayContaining(['startAt', 'type']),
    );
  });
});

describe('Candidates API', () => {
  it('returns a profile with meetings and accepts feedback', async () => {
    const { app, token } = await buildTestApp();
    const auth = { Authorization: `Bearer ${token}` };

    const search = await request(app).get('/api/candidates?search=alice').set(auth);
    const alice = search.body.data[0];
    expect(alice.name).toBe('Alice Johnson');

    const fb = await request(app)
      .post(`/api/candidates/${alice.id}/feedback`)
      .set(auth)
      .send({ rating: 5, comment: 'Excellent' });
    expect(fb.status).toBe(201);
    expect(fb.body.authorName).toBe('Riley Recruiter');

    const profile = await request(app).get(`/api/candidates/${alice.id}`).set(auth);
    expect(profile.body.pastMeetings.length).toBeGreaterThan(0);
    expect(profile.body.feedback[0].comment).toBe('Excellent');
  });
});
