import {
  Injectable,
  type BeforeApplicationShutdown,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { AppLogger } from './app-logger.service';

/**
 * Makes application lifecycle visible in the logs. Requires
 * `app.enableShutdownHooks()` in `main.ts` so signals (SIGTERM/SIGINT) reach
 * these hooks and the process only exits after a clean shutdown.
 */
@Injectable()
export class AppLifecycleLogger
  implements
    OnApplicationBootstrap,
    BeforeApplicationShutdown,
    OnApplicationShutdown
{
  private readonly logger = new AppLogger('Lifecycle');

  onApplicationBootstrap(): void {
    this.logger.debug('application booted');
  }

  beforeApplicationShutdown(signal?: string): void {
    this.logger.warn(`shutdown initiated${signal ? ` (signal: ${signal})` : ''}`);
  }

  onApplicationShutdown(): void {
    this.logger.log('shutdown complete');
  }
}
