import { UserId } from '../../../identity/domain/value-object/user-id.vo';
import { Account, AccountType } from '../../domain/entities/account.entity';
import { AccountId } from '../../domain/value-objects/account-id.vo';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
export interface AccountRepositoryPort {
  create(account: Account): Promise<void>;
  findById(accountId: AccountId): Promise<Account | null>;
  findByUserId(userId: UserId): Promise<Account[]>;
  findByUserIdAndType(
    userId: UserId,
    accountType: AccountType,
  ): Promise<Account | null>;
  changeStatus(account: Account): Promise<void>;
  deleteAccount(account: Account): Promise<void>;
}
