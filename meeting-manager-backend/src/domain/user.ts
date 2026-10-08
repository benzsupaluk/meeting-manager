export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export const toPublicUser = ({ passwordHash: _omit, ...user }: User): PublicUser => user;
