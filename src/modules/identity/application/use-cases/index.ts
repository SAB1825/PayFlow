import { RegisterUserHandler } from './register-user/register-user.handler';
import { LoginUserHandler } from './login-user/login-user.handler';
import { RefreshTokenHandler } from './refres-token/refresh-token.handler';

export const CommandHandlers = [
  RegisterUserHandler,
  LoginUserHandler,
  RefreshTokenHandler,
];
