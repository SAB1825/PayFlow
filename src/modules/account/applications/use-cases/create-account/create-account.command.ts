import { AccountType } from '../../../domain/entities/account.entity';

export class CreateAccountCommand {
  constructor(
    public readonly accountType: AccountType,
    public readonly userId: string,
  ) {}
}
