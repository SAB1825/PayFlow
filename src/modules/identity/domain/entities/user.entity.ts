import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { Email } from '../value-object/email.vo';
import { PasswordHash } from '../value-object/passwordHash.vo';
import { UserId } from '../value-object/user-id.vo';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  SUPPORT = 'SUPPORT',
}

interface UserProps {
  id: UserId;
  name: string;
  email: Email;
  passwordHash: PasswordHash;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private _id: UserId;
  private _name: string;
  private _email: Email;
  private _passwordHash: PasswordHash;
  private _role: UserRole;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    super();
    this._id = props.id;
    this._name = props.name;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._role = props.role;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static register(
    name: string,
    email: Email,
    passwordHash: PasswordHash,
  ): User {
    const now = new Date();

    return new User({
      id: UserId.create(),
      name,
      email,
      passwordHash,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): UserId {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  get role(): UserRole {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
