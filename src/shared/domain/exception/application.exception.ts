export enum ApplicationExceptionCode {
  VALIDATION_EXCEPTION = 'VALIDATION_EXCEPTION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

export class ApplicationException extends Error {
  constructor(
    message: string,
    public readonly code: ApplicationExceptionCode = ApplicationExceptionCode.VALIDATION_EXCEPTION,
  ) {
    super(message);
    this.name = 'Application Exception';
  }
}
