
export class RemoveBeneficiaryCommand {
  constructor(
    public readonly beneficiaryId: string,
    public readonly userId: string
  ) { }
}
