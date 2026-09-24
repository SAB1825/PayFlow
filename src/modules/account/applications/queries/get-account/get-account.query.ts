export class GetAccountQuery {
  constructor(
    public readonly userId: string,
    public readonly accountNumber: string,
  ) {}
}
