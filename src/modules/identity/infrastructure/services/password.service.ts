import * as argon2 from 'argon2';
import { PasswordHash } from '../../domain/value-object/passwordHash.vo';
import { PasswordHasher } from '../../application/ports/password-service';

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<PasswordHash> {
    const hash = await argon2.hash(value);

    return PasswordHash.fromHash(hash);
  }

  async verify(value: string, hash: PasswordHash): Promise<boolean> {
    return argon2.verify(hash.getValue(), value);
  }
}
