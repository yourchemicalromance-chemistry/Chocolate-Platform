import { afterEach, describe, expect, it, vi } from 'vitest';
import { coarsenDiscoveryCoordinate, DiscoveryRateLimitService } from './discovery-rate-limit.service.js';

describe('DiscoveryRateLimitService', () => {
  afterEach(() => { delete process.env.JWT_SECRET; });

  it('uses authenticated-user scoped Redis counters and rejects exhausted limits', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';
    const service = new DiscoveryRateLimitService();
    const evalMock = vi.fn(async (_script: string, _options: { keys: string[]; arguments: string[] }) => [0, 45]);
    Object.defineProperty(service, 'client', { value: { isOpen: true, eval: evalMock, quit: vi.fn().mockResolvedValue(undefined) } });
    await expect(service.consume('user-a', 'feed:minute', 20, 60)).rejects.toMatchObject({ status: 429 });
    expect(evalMock.mock.calls[0][1].keys[0]).not.toContain('user-a');
    expect(evalMock.mock.calls[0][1].arguments).toEqual(['60', '20']);
    await service.onModuleDestroy();
  });

  it('coalesces nearby origin probes into a bounded coarse cell', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';
    const service = new DiscoveryRateLimitService();
    const evalMock = vi.fn(async (_script: string, _options: { keys: string[]; arguments: string[] }) => [1, 1]);
    Object.defineProperty(service, 'client', { value: { isOpen: true, eval: evalMock, quit: vi.fn().mockResolvedValue(undefined) } });
    await service.consumeOrigin('user-a', 13.081, 80.271);
    await service.consumeOrigin('user-a', 13.084, 80.274);
    expect(evalMock.mock.calls[0][1].keys).toEqual(evalMock.mock.calls[1][1].keys);
    expect(evalMock.mock.calls[0][1].arguments[0]).toBe(evalMock.mock.calls[1][1].arguments[0]);
    expect(evalMock.mock.calls[0][1].arguments).toEqual(['13.08:80.27', '86400', '4']);
    expect(coarsenDiscoveryCoordinate(13.081)).toBe(13.08);
    expect(coarsenDiscoveryCoordinate(-122.125)).toBe(-122.13);
    await service.onModuleDestroy();
  });

  it('fails closed with 503 when Redis cannot connect', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';
    const service = new DiscoveryRateLimitService();
    const connect = vi.fn().mockRejectedValue(new Error('redis unavailable'));
    const evalMock = vi.fn();
    Object.defineProperty(service, 'client', { value: { isOpen: false, connect, eval: evalMock, quit: vi.fn() } });
    await expect(service.consume('user-a', 'feed:minute', 20, 60)).rejects.toMatchObject({ status: 503 });
    expect(evalMock).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when a connected Redis command fails', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';
    const service = new DiscoveryRateLimitService();
    const evalMock = vi.fn().mockRejectedValue(new Error('redis command failed'));
    Object.defineProperty(service, 'client', { value: { isOpen: true, eval: evalMock, quit: vi.fn().mockResolvedValue(undefined) } });
    await expect(service.consume('user-a', 'feed:minute', 20, 60)).rejects.toMatchObject({ status: 503 });
    await service.onModuleDestroy();
  });

  it('rejects a fifth distinct daily origin cell', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';
    const service = new DiscoveryRateLimitService();
    const evalMock = vi.fn().mockResolvedValue([0, 5]);
    Object.defineProperty(service, 'client', { value: { isOpen: true, eval: evalMock, quit: vi.fn().mockResolvedValue(undefined) } });
    await expect(service.consumeOrigin('user-a', 13.2, 80.4)).rejects.toMatchObject({ status: 429 });
    expect(evalMock.mock.calls[0][1].arguments).toEqual(['13.20:80.40', '86400', '4']);
    await service.onModuleDestroy();
  });
});
