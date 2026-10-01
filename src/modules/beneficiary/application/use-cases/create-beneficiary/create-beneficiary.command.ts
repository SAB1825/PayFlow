
export class CreateBeneficiaryCommand {
  constructor(
    public readonly userId: string,
    public readonly accountNumber: string,
    public readonly nickName: string
  ) { }
}
