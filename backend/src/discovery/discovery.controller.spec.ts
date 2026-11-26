import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { DiscoveryController } from './discovery.controller.js';
import { DiscoveryFeedQueryDto } from './discovery.dto.js';

describe('DiscoveryController authenticated ownership', () => {
  it('uses the authenticated principal for discovery and ignores caller supplied ownership', async () => {
    const service = { getFeed: vi.fn(async () => []) };
    const controller = new DiscoveryController(service as never);
    const request = { user: { id: 'authenticated-user-id' } } as never;
    const query = Object.assign(new DiscoveryFeedQueryDto(), { mode: 'browse' as const, query: 'Mira' });
    await controller.feed(request, query);
    expect(service.getFeed).toHaveBeenCalledWith('authenticated-user-id', query);
  });

  it('applies the JWT guard at controller scope', () => {
    const guards = Reflect.getMetadata('__guards__', DiscoveryController) as unknown[];
    expect(guards).toHaveLength(2);
  });
});
