import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ListBeneficiariesQuery } from "./list-beneficiaries.query";
import { Beneficiary } from "../../../domain/entity/beneficiary.entity";
import { Inject } from "@nestjs/common";
import { type BenefciaryPort, BENEFICIARY_REPOSITORY } from "../../ports/beneficiary-repository.port";
import { UserId } from "../../../../identity/domain/value-object/user-id.vo";


@QueryHandler(ListBeneficiariesQuery)
export class ListBeneficiariesHandler implements IQueryHandler<ListBeneficiariesQuery, Beneficiary[]> {
  constructor(
    @Inject(BENEFICIARY_REPOSITORY)
    private readonly beneficiaryRepository: BenefciaryPort
  ) { }

  async execute(query: ListBeneficiariesQuery): Promise<Beneficiary[]> {
    const userId = UserId.fromString(query.userId);
    return await this.beneficiaryRepository.findByOwner(userId);
  }
}
