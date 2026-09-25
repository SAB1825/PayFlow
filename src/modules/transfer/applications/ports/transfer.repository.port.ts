import { AccountId } from '../../../account/domain/value-objects/account-id.vo';
import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferId } from '../../domain/value-objects/transfer-id.vo';

export const TRANSFER_REPOSITORY = Symbol('TRANSFER_REPOSITORY');

export interface TransferRepositoryPort {
  create(transfer: Transfer): Promise<Transfer>;
  updateStatus(transfer: Transfer): Promise<Transfer>;
  findById(transferId: TransferId): Promise<Transfer | null>;
  findByIdempotencyKey(key: string): Promise<Transfer | null>;
  findByAccountId(
    accountId: AccountId,
    options?: { limit?: number; offset?: number },
  ): Promise<Transfer[]>;
}
