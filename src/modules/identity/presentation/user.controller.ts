import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseFilters,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserDto } from './dtos/register-user.dto';
import { RegisterUserCommand } from '../application/use-cases/register-user/register-user.command';
import { LoginUserDto } from './dtos/login-user.dto';
import type { Response } from 'express';
import { UserResponseDto } from './dtos/user-response.dto';
import { LoginUserCommand } from '../application/use-cases/login-user/login-user.command';
import { User } from '../domain/entities/user.entity';

@Controller('auth')
export class UserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto): Promise<void> {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto.name, dto.email, dto.password),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    user: UserResponseDto;
    accessToken: string;
  }> {
    const response = await this.commandBus.execute<
      LoginUserCommand,
      { user: User; accessToken: string; refreshToken: string }
    >(new LoginUserCommand(dto.email, dto.password));

    res.cookie('refresh_token', response.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return {
      user: UserResponseDto.fromDomain(response.user),
      accessToken: response.accessToken,
    };
  }
}
