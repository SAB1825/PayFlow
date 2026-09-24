import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { AccountRepositoryPort } from '../applications/ports/account-repository.port';

import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../shared/infrastructure/database/drizzle.types';

import {
  AccountDB,
  accounts,
} from '../../../shared/infrastructure/database/schemas';

import {
  Account,
  AccountStatus,
  AccountType,
} from '../domain/entities/account.entity';

import { AccountId } from '../domain/value-objects/account-id.vo';
import { AccountNumber } from '../domain/value-objects/account-number.vo';

import { UserId } from '../../identity/domain/value-object/user-id.vo';

import { Money } from '../../../shared/domain/money.vo';

@Injectable()
export class AccountRepository implements AccountRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDatabase,
  ) {}

  async create(account: Account): Promise<void> {
    await this.db.insert(accounts).values({
      id: account.id.getValue(),
      userId: account.userId.getValue(),
      accountNumber: account.accountNumber.getvalue(),
      accountType: account.accountType,
      balance: account.balance.paise,
      currency: account.currency,
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  }

  async findById(accountId: AccountId): Promise<Account | null> {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId.getValue()))
      .limit(1);

    if (!account) {
      return null;
    }

    return AccountRepository.toDomain(account);
  }

  async findByUserId(userId: UserId): Promise<Account[]> {
    const accs = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId.getValue()));

    return accs.map((account) => AccountRepository.toDomain(account));
  }

  async findByUserIdAndType(
    userId: UserId,
    accountType: AccountType,
  ): Promise<Account | null> {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId.getValue()),
          eq(accounts.accountType, accountType),
        ),
      )
      .limit(1);

    if (!account) {
      return null;
    }

    return AccountRepository.toDomain(account);
  }

  async changeStatus(account: Account): Promise<void> {
    const [existingAccount] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, account.id.getValue()))
      .limit(1);

    if (!existingAccount) {
      return;
    }

    await this.db
      .update(accounts)
      .set({
        status: account.status,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id.getValue()));
  }

  async deleteAccount(account: Account): Promise<void> {
    const [existingAccount] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, account.id.getValue()))
      .limit(1);

    if (!existingAccount) {
      return;
    }

    await this.db
      .delete(accounts)
      .where(eq(accounts.id, account.id.getValue()));
  }

  static toDomain(account: AccountDB): Account {
    return Account.reconstitute({
      id: AccountId.fromString(account.id),
      userId: UserId.fromString(account.userId),
      accountNumber: AccountNumber.fromString(account.accountNumber),
      accountType: account.accountType as AccountType,
      balance: Money.fromPaise(account.balance, account.currency),
      currency: account.currency,
      status: account.status as AccountStatus,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  }
}
