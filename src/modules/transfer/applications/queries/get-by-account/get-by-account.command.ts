export class GetByAccountQuery {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
  ) {}
}
