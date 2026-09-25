export class TransferCommand {
  constructor(
    public readonly userId: string,
    public readonly fromAccountNumber: string,
    public readonly toAccountNumber: string,
    public readonly idempotencyKey: string,
    public readonly ammount: number,
  ) {}
}
