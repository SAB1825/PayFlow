import { AccountNumber } from "../../../account/domain/value-objects/account-number.vo";
import { UserId } from "../../../identity/domain/value-object/user-id.vo";
import { Beneficiary } from "../../domain/entity/beneficiary.entity";
import { BeneficiaryId } from "../../domain/value-objects/beneficiary-id.vo";

export const BENEFICIARY_REPOSITORY = Symbol('BENEFICIARY_REPOSITORY');

export interface BenefciaryPort {
  save(beneficiary: Beneficiary): Promise<void>;
  findById(beneficiaryId: BeneficiaryId): Promise<Beneficiary | null>;
  findByOwnerAndAccount(
    ownerId: UserId,
    accountNumber: AccountNumber
  ): Promise<Beneficiary | null>;
  findByOwner(ownerId: UserId): Promise<Beneficiary[]>;
  delete(beneficiaryId: BeneficiaryId): Promise<void>;
}
