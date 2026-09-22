import { PasswordHash } from '../../domain/value-object/passwordHash.vo';

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  hash(value: string): Promise<PasswordHash>;
  verify(value: string, hash: PasswordHash): Promise<boolean>;
}
