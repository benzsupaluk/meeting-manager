import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../domain/errors.js';
import { toPublicUser, type PublicUser } from '../domain/user.js';
import type { UserRepository } from '../repositories/types.js';

export const GUEST_EMAIL = 'guest@meetingmanager.local';

// Compared against when the email is unknown so response time doesn't reveal account existence.
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy', 10);

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AuthConfig,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedError('Invalid email or password');
    return this.issue(toPublicUser(user));
  }

  async loginAsGuest() {
    const guest = await this.users.findByEmail(GUEST_EMAIL);
    if (!guest) throw new UnauthorizedError('Guest access is disabled');
    return this.issue(toPublicUser(guest));
  }

  verify(token: string): PublicUser {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as TokenPayload;
      return { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  static hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private issue(user: PublicUser) {
    const payload: TokenPayload = { sub: user.id, email: user.email, name: user.name };
    const token = jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn as SignOptions['expiresIn'],
    });
    return { token, user };
  }
}
