export class GetByIdQuery {
  constructor(
    public readonly userId: string,
    public readonly transferId: string,
  ) {}
}
