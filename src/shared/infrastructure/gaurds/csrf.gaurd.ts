import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { ApplicationException, ApplicationExceptionCode } from "../../domain/exception/application.exception";

@Injectable()
export class CsrfGaurd implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>()
    const cookie = req.cookies['csrf_token'];
    const headerToken = req.headers['x-csrf-token'];
    if (!cookie || cookie !== headerToken) throw new ApplicationException("Your are not authorized", ApplicationExceptionCode.UNAUTHORIZED);

    return true
  }
}
