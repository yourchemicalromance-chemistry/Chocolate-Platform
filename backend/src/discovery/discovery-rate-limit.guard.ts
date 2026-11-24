import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../media/authenticated-user.js';
import { DiscoveryRateLimitService } from './discovery-rate-limit.service.js';

@Injectable()
export class DiscoveryRateLimitGuard implements CanActivate {
  constructor(private readonly limits: DiscoveryRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const route = String(request.route?.path ?? request.path);
    if (route.includes('location-search')) {
      await this.limits.consume(request.user.id, 'location-search:hour', 5, 3600);
      await this.limits.consume(request.user.id, 'location-search:day', 12, 86400);
      if (request.method === 'POST') {
        const { latitude, longitude } = request.body as { latitude?: number; longitude?: number };
        if (typeof latitude === 'number' && typeof longitude === 'number') await this.limits.consumeOrigin(request.user.id, latitude, longitude);
      }
    } else if (route.includes('nearby') && request.method === 'POST') {
      await this.limits.consume(request.user.id, 'nearby:hour', 10, 3600);
      await this.limits.consume(request.user.id, 'nearby:day', 30, 86400);
      const { latitude, longitude } = request.body as { latitude?: number; longitude?: number };
      if (typeof latitude === 'number' && typeof longitude === 'number') await this.limits.consumeOrigin(request.user.id, latitude, longitude);
    } else if (route.includes('feed')) {
      await this.limits.consume(request.user.id, 'feed:minute', 20, 60);
      await this.limits.consume(request.user.id, 'feed:hour', 120, 3600);
    } else {
      await this.limits.consume(request.user.id, `route:${request.method}:${route}`, 60, 60);
    }
    return true;
  }
}
