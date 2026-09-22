import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterUserCommand } from './register-user.command';
import { Inject } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../ports/password-hasher';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../ports/user-repository.port';
import { UserId } from '../../../domain/value-object/user-id.vo';
import { Email } from '../../../domain/value-object/email.vo';
import { User, UserRole } from '../../../domain/entities/user.entity';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<
  RegisterUserCommand,
  void
> {
  constructor(
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const email = new Email(command.email);
    const existingEmail = await this.userRepository.findByEmail(email);

    if (existingEmail) {
      throw new Error('User with email already exsists');
    }

    const passwordHash = await this.passwordHasher.hash(command.password);

    const user = User.register(command.name, email, passwordHash);

    await this.userRepository.register(user);

    
  }
}
