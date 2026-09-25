import { Inject, Injectable } from '@nestjs/common';
import { TransferRepositoryPort } from '../applications/ports/transfer.repository.port';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../../../shared/infrastructure/database/drizzle.types';
import { Transfer, TransferStatus } from '../domain/entities/transfer.entity';
import {
  NewTransferDB,
  TransferDB,
  transfers,
} from '../../../shared/infrastructure/database/schemas';
import { TransferId } from '../domain/value-objects/transfer-id.vo';
import { UserId } from '../../identity/domain/value-object/user-id.vo';
import { AccountId } from '../../account/domain/value-objects/account-id.vo';
import { Money } from '../../../shared/domain/money.vo';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../shared/domain/exception/application.exception';
import { isUniqueViolation } from '../../../shared/infrastructure/database/errors/unique-violation.error';
import { desc, eq, or } from 'drizzle-orm';

@Injectable()
export class TransferRepository implements TransferRepositoryPort {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {}

  async create(transfer: Transfer): Promise<Transfer> {
    try {
      const [row] = await this.db
        .insert(transfers)
        .values(TransferRepository.toPersistance(transfer))
        .returning();

      return TransferRepository.toDomain(row);
    } catch (error) {
      if (isUniqueViolation(error, 'idempotency_key')) {
        throw new ApplicationException(
          'Duplicate transfer request',
          ApplicationExceptionCode.CONFLICT,
        );
      }
      throw error;
    }
  }

  async updateStatus(transfer: Transfer): Promise<Transfer> {
    const [updatedRow] = await this.db
      .update(transfers)
      .set({
        status: transfer.status,
        failureReason: transfer.failureReason,
        updatedAt: transfer.updatedAt,
      })
      .where(eq(transfers.id, transfer.id.getValue()))
      .returning();

    if (!updatedRow) {
      throw new ApplicationException(
        'No transfer found for given id',
        ApplicationExceptionCode.NOT_FOUND,
      );
    }

    return TransferRepository.toDomain(updatedRow);
  }

  async findById(transferId: TransferId): Promise<Transfer | null> {
    const [row] = await this.db
      .select()
      .from(transfers)
      .where(eq(transfers.id, transferId.getValue()))
      .limit(1);
    if (!row) return null;

    return TransferRepository.toDomain(row);
  }

  async findByAccountId(
    accountId: AccountId,
    options?: { limit?: number; offset?: number },
  ): Promise<Transfer[]> {
    const query = this.db
      .select()
      .from(transfers)
      .where(
        or(
          eq(transfers.fromAccId, accountId.getValue()),
          eq(transfers.toAccId, accountId.getValue()),
        ),
      )
      .orderBy(desc(transfers.createdAt));

    if (options?.limit !== undefined) {
      query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query.offset(options.offset);
    }

    const rows = await query;
    return rows.map((row) => TransferRepository.toDomain(row));
  }

  async findByIdempotencyKey(key: string): Promise<Transfer | null> {
    const [row] = await this.db
      .select()
      .from(transfers)
      .where(eq(transfers.idempotencyKey, key))
      .limit(1);

    if (!row) return null;

    return TransferRepository.toDomain(row);
  }
  static toDomain(transfer: TransferDB): Transfer {
    return new Transfer({
      id: TransferId.fromString(transfer.id),
      initiatedBy: UserId.fromString(transfer.initiatedBy),
      fromAccId: AccountId.fromString(transfer.fromAccId),
      toAccId: AccountId.fromString(transfer.toAccId),
      amount: Money.fromPaise(transfer.amount, transfer.currency),
      idempotencyKey: transfer.idempotencyKey,
      status: transfer.status as TransferStatus,
      failureReason: transfer.failureReason,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    });
  }

  static toPersistance(transfer: Transfer): NewTransferDB {
    return {
      id: transfer.id.getValue(),
      initiatedBy: transfer.initiatedBy.getValue(),
      fromAccId: transfer.fromAccountId.getValue(),
      toAccId: transfer.toAccountId.getValue(),
      amount: transfer.amount.paise,
      currency: transfer.amount.currency,
      status: transfer.status,
      failureReason: transfer.failureReason,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    };
  }
}
