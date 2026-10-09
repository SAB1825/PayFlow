export class GetAccountQuery {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
  ) {}
}
