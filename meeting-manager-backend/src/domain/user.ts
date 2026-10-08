export const GUEST_EMAIL = 'guest@meetingmanager.local';

export type UserRole = 'member' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export type PublicUser = Omit<User, 'passwordHash'> & { role: UserRole };

/** Guests are a single shared read-only account, identified by its reserved email. */
export const roleFor = (email: string): UserRole =>
  email.toLowerCase() === GUEST_EMAIL ? 'guest' : 'member';

export const toPublicUser = ({ passwordHash: _omit, ...user }: User): PublicUser => ({
  ...user,
  role: roleFor(user.email),
});
