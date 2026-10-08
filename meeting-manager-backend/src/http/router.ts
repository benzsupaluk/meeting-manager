import { Router } from 'express';
import type { Services } from '../container.js';
import { AuthController } from './controllers/auth.controller.js';
import { CandidateController } from './controllers/candidate.controller.js';
import { MeetingController } from './controllers/meeting.controller.js';
import { requireAuth, requireMember } from './middleware/auth.js';

export function createRouter(services: Services): Router {
  const router = Router();
  const auth = new AuthController(services.auth);
  const meetings = new MeetingController(services.meetings);
  const candidates = new CandidateController(services.candidates);
  const authenticated = requireAuth(services.auth);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.post('/auth/login', auth.login);
  router.post('/auth/guest', auth.guest);
  router.post('/auth/logout', auth.logout);
  router.get('/auth/me', authenticated, auth.me);

  router.use(authenticated);

  router.get('/meetings', meetings.list);
  router.post('/meetings', requireMember, meetings.create);
  router.get('/meetings/:id', meetings.get);
  router.patch('/meetings/:id', meetings.update);
  router.delete('/meetings/:id', meetings.delete);

  router.get('/positions', candidates.positions);
  router.get('/candidates', candidates.search);
  router.get('/candidates/:id', candidates.get);
  router.patch('/candidates/:id/notes', candidates.updateNotes);
  router.post('/candidates/:id/feedback', candidates.addFeedback);

  return router;
}
