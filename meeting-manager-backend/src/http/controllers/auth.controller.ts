import type { Request, Response } from 'express';
import type { AuthService } from '../../services/auth.service.js';
import { parse } from '../middleware/validate.js';
import { LoginSchema } from '../schemas.js';

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  login = async (req: Request, res: Response) => {
    const { email, password } = parse(LoginSchema, req.body);
    res.json(await this.auth.login(email, password));
  };

  guest = async (_req: Request, res: Response) => {
    res.json(await this.auth.loginAsGuest());
  };

  me = (req: Request, res: Response) => {
    res.json({ user: req.user });
  };

  /** Tokens are stateless JWTs; the client discards its copy. Kept for a symmetric API. */
  logout = (_req: Request, res: Response) => {
    res.status(204).end();
  };
}
