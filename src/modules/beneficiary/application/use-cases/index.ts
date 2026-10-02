import { CreateBeneficiaryHandler } from "./create-beneficiary/create-beneficiary.handler";
import { RemoveBeneficiaryHandler } from "./remove-beneficiary/remove-beneficiary.handler";

export const CommandHandlers = [
  CreateBeneficiaryHandler,
  RemoveBeneficiaryHandler
]
