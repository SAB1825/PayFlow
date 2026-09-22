import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetProfileQuery } from './get-profile.command';
import { User } from '../../../domain/entities/user.entity';
import { Inject } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../ports/user-repository.port';
import { UserId } from '../../../domain/value-object/user-id.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../../../shared/domain/exception/application.exception';

@QueryHandler(GetProfileQuery)
export class GetProfileHandler implements IQueryHandler<GetProfileQuery, User> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: GetProfileQuery): Promise<User> {
    const user = await this.userRepository.findById(
      UserId.fromString(query.id),
    );

    if (!user)
      throw new ApplicationException(
        'User not found from the given id',
        ApplicationExceptionCode.NOT_FOUND,
      );

    return user;
  }
}
