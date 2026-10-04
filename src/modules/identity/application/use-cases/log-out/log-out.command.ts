
export class LogOutCommand {
  constructor(
    public readonly rawToken: string,
    public readonly userId: string,
  ) { }
}
