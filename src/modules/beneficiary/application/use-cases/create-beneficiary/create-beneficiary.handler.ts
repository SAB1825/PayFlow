import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateBeneficiaryCommand } from "./create-beneficiary.command";
import { Inject } from "@nestjs/common";
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from "../../../../account/applications/ports/account-repository.port";
import { type BenefciaryPort, BENEFICIARY_REPOSITORY } from "../../ports/beneficiary-repository.port";
import { UserId } from "../../../../identity/domain/value-object/user-id.vo";
import { AccountNumber } from "../../../../account/domain/value-objects/account-number.vo";
import { ApplicationException, ApplicationExceptionCode } from "../../../../../shared/domain/exception/application.exception";
import { Beneficiary, BeneficiaryStatus } from "../../../domain/entity/beneficiary.entity";

@CommandHandler(CreateBeneficiaryCommand)
export class CreateBeneficiaryHandler implements ICommandHandler<CreateBeneficiaryCommand, Beneficiary> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(BENEFICIARY_REPOSITORY)
    private readonly beneficiaryRepository: BenefciaryPort
  ) { }

  async execute(command: CreateBeneficiaryCommand): Promise<Beneficiary> {
    const ownerId = UserId.fromString(command.userId);
    const accountNumber = AccountNumber.fromString(command.accountNumber);

    //CHECKS:
    // 1. Check whether given beneficiary has an account
    // 2. Avoid creating own account as beneficiary.
    const beneficaryAccount = await this.accountRepository.findByNumber(accountNumber);
    if (!beneficaryAccount) {
      throw new ApplicationException("No account found for the given beneficiary.", ApplicationExceptionCode.NOT_FOUND)
    }
    if (beneficaryAccount.userId.equals(ownerId)) {
      throw new ApplicationException("You cann't add your own account has beneficiary", ApplicationExceptionCode.UNAUTHORIZED);
    }


    //CHECKS:
    // 1. Check whether give beneficiary already exists
    // 2. If exists, check status and update it.
    const existing = await this.beneficiaryRepository.findByOwnerAndAccount(
      ownerId,
      accountNumber
    )
    if (existing) {
      if (existing.status === BeneficiaryStatus.ACTIVE) {
        throw new ApplicationException("Beneficiary already exists", ApplicationExceptionCode.CONFLICT);
      }
      existing.activate();
      await this.beneficiaryRepository.save(existing);
      return existing;
    }

    const beneficiary = Beneficiary.create(ownerId, accountNumber, command.nickName);

    await this.beneficiaryRepository.save(beneficiary);

    return beneficiary;
  }
}
