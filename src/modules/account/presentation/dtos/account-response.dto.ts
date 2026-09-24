import { Account } from '../../domain/entities/account.entity';

export class AccountResponseDto {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  static fromDomain(account: Account): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.id.getValue();
    dto.accountNumber = account.accountNumber.getvalue();
    dto.accountType = account.accountType;
    dto.status = account.status;
    dto.createdAt = account.createdAt.toISOString();
    dto.updatedAt = account.updatedAt.toISOString();

    return dto;
  }
}
