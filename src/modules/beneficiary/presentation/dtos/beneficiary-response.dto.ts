import { Beneficiary } from "../../domain/entity/beneficiary.entity";


export class BeneficiaryResponseDto {
  id: string;
  ownerUserId: string;
  accountNumber: string;
  nickName: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  static fromDomain(beneficiary: Beneficiary): BeneficiaryResponseDto {
    const dto = new BeneficiaryResponseDto();
    dto.id = beneficiary.id.getValue();
    dto.accountNumber = beneficiary.accountNumber.getvalue();
    dto.ownerUserId = beneficiary.ownerUserId.getValue();
    dto.nickName = beneficiary.nickname;
    dto.status = beneficiary.status;
    dto.createdAt = beneficiary.createdAt.toISOString();
    dto.updatedAt = beneficiary.updatedAt.toISOString();

    return dto;
  }
}
