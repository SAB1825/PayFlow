import { Inject, Injectable } from "@nestjs/common";
import { BenefciaryPort } from "../application/ports/beneficiary-repository.port";
import { DRIZZLE_DB, type DrizzleDatabase } from "../../../shared/infrastructure/database/drizzle.types";
import { Beneficiary, BeneficiaryStatus } from "../domain/entity/beneficiary.entity";
import {
  beneficiaries,
  beneficiaryStatus as beneficiaryStatusEnum,
  BeneficiaryDB,
} from "../../../shared/infrastructure/database/schemas";
import { UserId } from "../../identity/domain/value-object/user-id.vo";
import { AccountNumber } from "../../account/domain/value-objects/account-number.vo";
import { BeneficiaryId } from "../domain/value-objects/beneficiary-id.vo";
import { and, eq } from "drizzle-orm";


@Injectable()
export class BeneficiaryRepository implements BenefciaryPort {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase
  ) { }

  async save(beneficiary: Beneficiary): Promise<void> {
    const existing = await this.findByOwnerAndAccount(
      beneficiary.ownerUserId,
      beneficiary.accountNumber,
    )

    if (existing) {
      // Re-activating a previously removed beneficiary must update the
      // existing row rather than insert a duplicate (or throw a conflict).
      await this.db
        .update(beneficiaries)
        .set({
          nickName: beneficiary.nickname,
          status: BeneficiaryRepository.toPersistenceStatus(beneficiary.status),
          updatedAt: beneficiary.updatedAt,
        })
        .where(eq(beneficiaries.id, existing.id.getValue()));

      return;
    }

    await this.db
      .insert(beneficiaries)
      .values({
        id: beneficiary.id.getValue(),
        ownerUserId: beneficiary.ownerUserId.getValue(),
        accountNumber: beneficiary.accountNumber.getvalue(),
        nickName: beneficiary.nickname,
        status: BeneficiaryRepository.toPersistenceStatus(beneficiary.status),
        createdAt: beneficiary.createdAt,
        updatedAt: beneficiary.updatedAt,
      });
  }

  async findById(beneficiaryId: BeneficiaryId): Promise<Beneficiary | null> {
    const [row] = await this.db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.id, beneficiaryId.getValue()))
      .limit(1)

    if (!row) return null;

    return BeneficiaryRepository.toDomain(row)
  }

  async findByOwnerAndAccount(ownerId: UserId, accountNumber: AccountNumber): Promise<Beneficiary | null> {
    const [row] = await this.db
      .select()
      .from(beneficiaries)
      .where(and(
        eq(beneficiaries.ownerUserId, ownerId.getValue()),
        eq(beneficiaries.accountNumber, accountNumber.getvalue())
      ))
      .limit(1)

    if (!row) return null;

    return BeneficiaryRepository.toDomain(row)
  }

  async findByOwner(ownerId: UserId): Promise<Beneficiary[]> {
    const rows = await this.db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.ownerUserId, ownerId.getValue()))

    return rows.map(BeneficiaryRepository.toDomain)
  }

  async delete(beneficiaryId: BeneficiaryId): Promise<void> {
    await this.db
      .update(beneficiaries)
      .set({ status: 'REMOVE' })
      .where(eq(beneficiaries.id, beneficiaryId.getValue()))
  }

  private static toPersistenceStatus(status: BeneficiaryStatus): typeof beneficiaryStatusEnum.enumValues[number] {
    return status === BeneficiaryStatus.REMOVED ? 'REMOVE' : 'ACTIVE';
  }

  private static toDomainStatus(status: typeof beneficiaryStatusEnum.enumValues[number]): BeneficiaryStatus {
    return status === 'REMOVE' ? BeneficiaryStatus.REMOVED : BeneficiaryStatus.ACTIVE;
  }

  static toDomain(beneficiary: BeneficiaryDB): Beneficiary {
    return new Beneficiary({
      id: BeneficiaryId.fromString(beneficiary.id),
      ownerUserId: UserId.fromString(beneficiary.ownerUserId),
      nickname: beneficiary.nickName,
      accountNumber: AccountNumber.fromString(beneficiary.accountNumber),
      status: BeneficiaryRepository.toDomainStatus(beneficiary.status),
      createdAt: beneficiary.createdAt,
      updatedAt: beneficiary.updatedAt,
    }
    )
  }

}
