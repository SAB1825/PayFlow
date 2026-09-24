import { IsEnum } from 'class-validator';
import { AccountType } from '../../domain/entities/account.entity';

export class CreateAccountDto {
  @IsEnum(AccountType, {
    message: 'Type must be: [Savings or Current]',
  })
  accountType: AccountType;
}
