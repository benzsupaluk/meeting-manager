import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../domain/errors.js';
import type { PublicUser } from '../../domain/user.js';
import type { AuthService } from '../../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export const requireAuth =
  (auth: AuthService): RequestHandler =>
  (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing bearer token');
    req.user = auth.verify(header.slice('Bearer '.length));
    next();
  };
