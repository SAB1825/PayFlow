import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../application/ports/user-repository.port';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../../shared/infrastructure/database/drizzle.types';
import { User, UserRole } from '../../domain/entities/user.entity';
import {
  UserDB,
  users,
} from '../../../../shared/infrastructure/database/schemas/user.schema';
import { UserId } from '../../domain/value-object/user-id.vo';
import { Email } from '../../domain/value-object/email.vo';
import { PasswordHash } from '../../domain/value-object/passwordHash.vo';
import { eq } from 'drizzle-orm';
import { ApplicationException, ApplicationExceptionCode } from '../../../../shared/domain/exception/application.exception';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {}

  async register(user: User): Promise<void> {
    const row = UserRepository.toPersistance(user);

    try {
      await this.db.insert(users).values(row);
    } catch (error) {
      if (UserRepository.isUniqueViolation(error)) {
        throw new ApplicationException("User Already exisits", ApplicationExceptionCode.CONFLICT);
      }
      throw error;
    }
  }

  async findById(userId: UserId): Promise<User | null> {
    const row = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId.getValue()));

    if (row.length === 0) {
      return null;
    }

    return UserRepository.toDomain(row[0]);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.getValue()));

    if (row.length === 0) {
      return null;
    }

    return UserRepository.toDomain(row[0]);
  }

  static toPersistance(user: User): UserDB {
    return {
      id: user.id.getValue(),
      name: user.name,
      email: user.email.getValue(),
      passwordHash: user.passwordHash.getValue(),
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toDomain(user: UserDB): User {
    return User.reconstitute({
      id: UserId.fromString(user.id),
      email: new Email(user.email),
      name: user.name,
      passwordHash: PasswordHash.fromHash(user.passwordHash),
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  private static isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
