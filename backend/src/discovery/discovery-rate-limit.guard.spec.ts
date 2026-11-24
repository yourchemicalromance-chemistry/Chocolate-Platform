import { describe, expect, it, vi } from 'vitest';
import { DiscoveryRateLimitGuard } from './discovery-rate-limit.guard.js';

describe('DiscoveryRateLimitGuard', () => {
  function context(path: string, method: string, body: Record<string, unknown> = {}) {
    return { switchToHttp: () => ({ getRequest: () => ({ user: { id: 'authenticated-user' }, path, method, body }) }) } as never;
  }

  it.each(['/discovery/nearby', '/discovery/location-search'])('applies per-user request and coarse-origin limits to %s', async path => {
    const limits = { consume: vi.fn(async () => undefined), consumeOrigin: vi.fn(async () => undefined) };
    const guard = new DiscoveryRateLimitGuard(limits as never);
    await expect(guard.canActivate(context(path, 'POST', { latitude: 13.081, longitude: 80.271 }))).resolves.toBe(true);
    expect(limits.consume).toHaveBeenCalledWith('authenticated-user', path.endsWith('nearby') ? 'nearby:hour' : 'location-search:hour', expect.any(Number), 3600);
    expect(limits.consumeOrigin).toHaveBeenCalledWith('authenticated-user', 13.081, 80.271);
  });

  it('rate limits discovery feeds using the authenticated principal', async () => {
    const limits = { consume: vi.fn(async () => undefined), consumeOrigin: vi.fn(async () => undefined) };
    const guard = new DiscoveryRateLimitGuard(limits as never);
    await guard.canActivate(context('/discovery/feed', 'GET'));
    expect(limits.consume).toHaveBeenCalledWith('authenticated-user', 'feed:minute', 20, 60);
    expect(limits.consume).toHaveBeenCalledWith('authenticated-user', 'feed:hour', 120, 3600);
  });
});
