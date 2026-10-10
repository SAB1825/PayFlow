import { AccountId } from '../../../account/domain/value-objects/account-id.vo';
import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferId } from '../../domain/value-objects/transfer-id.vo';
import { TransactionHandle } from '../../../../shared/application/unit-of-work.port';

export const TRANSFER_REPOSITORY = Symbol('TRANSFER_REPOSITORY');

export interface TransferRepositoryPort {
  create(transfer: Transfer, tx?: TransactionHandle): Promise<Transfer>;
  updateStatus(transfer: Transfer): Promise<Transfer>;
  findById(transferId: TransferId): Promise<Transfer | null>;
  findByIdempotencyKey(key: string): Promise<Transfer | null>;
  findByAccountId(
    accountId: AccountId,
    options?: { limit?: number; offset?: number },
  ): Promise<Transfer[]>;
}
