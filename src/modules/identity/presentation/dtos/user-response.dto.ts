import { User } from '../../domain/entities/user.entity';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;

  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id.getValue();
    dto.email = user.email.getValue();
    dto.name = user.name;
    dto.role = user.role;
    dto.createdAt = user.createdAt.toISOString();
    dto.updatedAt = user.updatedAt.toISOString();

    return dto;
  }
}
