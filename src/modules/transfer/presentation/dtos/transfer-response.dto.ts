import { Transfer } from '../../domain/entities/transfer.entity';

export class TransferResponseDto {
  id: string;
  initiatedBy: string;
  fromAccId: string;
  toAccId: string;
  amount: number;
  status: string;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;

  static fromDomain(transfer: Transfer): TransferResponseDto {
    const dto = new TransferResponseDto();
    dto.id = transfer.id.getValue();
    dto.initiatedBy = transfer.initiatedBy.getValue();
    dto.fromAccId = transfer.fromAccountId.getValue();
    dto.toAccId = transfer.toAccountId.getValue();
    dto.amount = transfer.amount.toRupee();
    dto.status = transfer.status;
    dto.failureReason = transfer.failureReason;
    dto.createdAt = transfer.createdAt.toISOString();
    dto.updatedAt = transfer.updatedAt.toISOString();

    return dto;
  }
}
