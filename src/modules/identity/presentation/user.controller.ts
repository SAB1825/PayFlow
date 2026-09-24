import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserDto } from './dtos/register-user.dto';
import { RegisterUserCommand } from '../application/use-cases/register-user/register-user.command';
import { LoginUserDto } from './dtos/login-user.dto';
import type { Response } from 'express';
import { UserResponseDto } from './dtos/user-response.dto';
import { LoginUserCommand } from '../application/use-cases/login-user/login-user.command';
import { User } from '../domain/entities/user.entity';
import { Public } from '../../../shared/infrastructure/decorators/public.decorator';
import { AuthGaurd } from '../../../shared/infrastructure/gaurds/auth.gaurd';
import { CurrentUser } from '../../../shared/infrastructure/decorators/current-user.decorator';
import { GetProfileDto } from './dtos/get-profile.dto';
import { GetProfileQuery } from '../application/queries/get-profile/get-profile.command';
import { RefreshTokenCommand } from '../application/use-cases/refres-token/refresh-token.command';
import { RefreshTokenDto } from './dtos/refresh-token.dto';

@Controller('auth')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto): Promise<void> {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto.name, dto.email, dto.password),
    );
  }

  @Public()
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

  @Public()
  @Post('refresh')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    user: UserResponseDto;
    accessToken: string;
  }> {
    const result = await this.commandBus.execute<
      RefreshTokenCommand,
      {
        user: User;
        accessToken: string;
        refreshToken: string;
      }
    >(new RefreshTokenCommand(dto.refreshToken));

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return {
      user: UserResponseDto.fromDomain(result.user),
      accessToken: result.accessToken,
    };
  }

  @Get('me')
  @UseGuards(AuthGaurd)
  async getProfile(
    @CurrentUser() dto: GetProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.queryBus.execute<GetProfileQuery, User>(
      new GetProfileQuery(dto.sub),
    );

    return UserResponseDto.fromDomain(user);
  }
}
