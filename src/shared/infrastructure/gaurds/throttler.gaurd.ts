import { ThrottlerGuard } from "@nestjs/throttler";

export class UserThrottlerGaurd extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user.sub ?? req.ip;
  }
}
