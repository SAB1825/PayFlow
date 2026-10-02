import { Module } from "@nestjs/common";
import { BeneficiaryController } from "./presentation/beneficiary.controller";
import { CqrsModule } from "@nestjs/cqrs";
import { AccountModule } from "../account/account.module";
import { CommandHandlers } from "./application/use-cases";
import { BENEFICIARY_REPOSITORY } from "./application/ports/beneficiary-repository.port";
import { BeneficiaryRepository } from "./infrastructure/beneficiary.repository";
import { QueryHandlers } from "./application/queries";

@Module({
  imports: [
    CqrsModule,
    AccountModule,
  ],
  controllers: [BeneficiaryController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: BENEFICIARY_REPOSITORY,
      useClass: BeneficiaryRepository,
    }
  ]

})
export class BeneficiaryModule { }
