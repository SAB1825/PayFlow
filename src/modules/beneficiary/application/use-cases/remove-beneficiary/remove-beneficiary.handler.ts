import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RemoveBeneficiaryCommand } from "./remove-beneficiary.command";
import { type BenefciaryPort, BENEFICIARY_REPOSITORY } from "../../ports/beneficiary-repository.port";
import { UserId } from "../../../../identity/domain/value-object/user-id.vo";
import { BeneficiaryId } from "../../../domain/value-objects/beneficiary-id.vo";
import { ApplicationException, ApplicationExceptionCode } from "../../../../../shared/domain/exception/application.exception";
import { Inject } from "@nestjs/common";


@CommandHandler(RemoveBeneficiaryCommand)
export class RemoveBeneficiaryHandler implements ICommandHandler<RemoveBeneficiaryCommand, void> {
  constructor(
    @Inject(BENEFICIARY_REPOSITORY)
    private readonly beneficiaryRepository: BenefciaryPort
  ) { }

  async execute(command: RemoveBeneficiaryCommand): Promise<void> {
    const beneficiaryId = BeneficiaryId.fromString(command.beneficiaryId);
    const ownerUserId = UserId.fromString(command.userId);

    const beneficiary = await this.beneficiaryRepository.findById(beneficiaryId);

    if (!beneficiary) throw new ApplicationException("Beneficiary not found", ApplicationExceptionCode.NOT_FOUND);

    if (!beneficiary.ownerUserId.equals(ownerUserId)) throw new ApplicationException("You are not authorized", ApplicationExceptionCode.UNAUTHORIZED);

    await this.beneficiaryRepository.delete(beneficiaryId);
  }
}
