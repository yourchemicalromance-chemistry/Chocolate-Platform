import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from './authenticated-user.js';

@Injectable()
export class MediaRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private readonly maxHits = positiveEnv('MEDIA_RATE_LIMIT_COUNT', 12);
  private readonly windowMs = positiveEnv('MEDIA_RATE_LIMIT_WINDOW_MS', 60_000);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const key = `${request.user.id}:${request.route?.path ?? request.path}`;
    const now = Date.now();
    const current = this.hits.get(key);
    if (!current || current.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    current.count += 1;
    if (current.count > this.maxHits) throw new HttpException('Too many media requests.', HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}

function positiveEnv(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
