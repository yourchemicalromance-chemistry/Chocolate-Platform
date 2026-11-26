import { ServiceUnavailableException } from '@nestjs/common';
import { LoginRateLimitService } from './login-rate-limit.service.js';

type Entry = { value: number; expiresAt: number };

function inMemoryRedis() {
  const entries = new Map<string, Entry>();
  return {
    isOpen: true,
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    entries,
    eval: vi.fn(async (script: string, options: { keys: string[]; arguments: string[] }) => {
      const now = Date.now();
      const read = (key: string) => {
        const entry = entries.get(key);
        if (entry && entry.expiresAt <= now) entries.delete(key);
        return entries.get(key);
      };
      const ttl = (key: string) => Math.max(0, (read(key)?.expiresAt ?? now) - now);

      if (script.includes('KEYS[3]') && !script.includes('local limits')) {
        return options.keys.map(ttl);
      }
      if (script.includes('local limits =')) {
        const args = options.arguments.map(Number);
        const limits = args.slice(1, 4);
        const bases = args.slice(4, 7);
        let maxActive = 0;
        for (let i = 0; i < 3; i += 1) {
          const counterKey = options.keys[i];
          const cooldownKey = options.keys[i + 3];
          const streakKey = options.keys[i + 6];
          let remaining = ttl(cooldownKey);
          if (remaining === 0) {
            const current = read(counterKey);
            const count = (current?.value ?? 0) + 1;
            if (current) current.value = count;
            else entries.set(counterKey, { value: count, expiresAt: now + args[0] * 1000 });
            if (count >= limits[i] && !read(cooldownKey)) {
              const priorStreak = read(streakKey);
              const streak = (priorStreak?.value ?? 0) + 1;
              entries.set(streakKey, { value: streak, expiresAt: now + args[8] * 1000 });
              const duration = Math.min(bases[i] * 2 ** Math.min(streak - 1, 10), args[7]);
              entries.set(cooldownKey, { value: 1, expiresAt: now + duration * 1000 });
              remaining = duration * 1000;
            }
          }
          maxActive = Math.max(maxActive, remaining);
        }
        return maxActive;
      }
      if (script.includes("redis.call('DEL', unpack(KEYS))")) {
        for (const key of options.keys) entries.delete(key);
        return options.keys.length;
      }
      throw new Error('Unexpected rate-limit script.');
    }),
  };
}

describe('LoginRateLimitService', () => {
  let service: LoginRateLimitService;
  let redis: ReturnType<typeof inMemoryRedis>;

  beforeEach(() => {
    process.env.JWT_SECRET = 'a-stable-test-secret-that-is-long-enough';
    service = new LoginRateLimitService();
    redis = inMemoryRedis();
    Object.defineProperty(service, 'client', { value: redis, configurable: true });
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    vi.useRealTimers();
  });

  it('applies the account threshold and progressive cooldown while retaining counters across identifiers', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T00:00:00Z'));
    for (let i = 0; i < 4; i += 1) {
      await expect(service.recordFailure('192.0.2.1', 'email:ada@example.com')).resolves.toBe(0);
    }
    await expect(service.recordFailure('192.0.2.1', 'email:ada@example.com')).resolves.toBe(60);
    await expect(service.inspect('192.0.2.1', 'email:ada@example.com')).resolves.toEqual({
      ipCooldownSeconds: 0,
      accountCooldownSeconds: 60,
      combinedCooldownSeconds: 30,
    });

    vi.advanceTimersByTime(61_000);
    await expect(service.inspect('192.0.2.1', 'email:ada@example.com')).resolves.toMatchObject({
      accountCooldownSeconds: 0,
      combinedCooldownSeconds: 0,
    });
    await expect(service.recordFailure('192.0.2.1', 'email:ada@example.com')).resolves.toBe(120);
  });

  it('limits repeated failures by client IP across distinct identifiers', async () => {
    for (let i = 0; i < 19; i += 1) {
      await service.recordFailure('198.51.100.8', `email:user${i}@example.com`);
    }
    await expect(service.recordFailure('198.51.100.8', 'mobile:+919876543210')).resolves.toBe(60);
    await expect(service.inspect('198.51.100.8', 'email:another@example.com')).resolves.toMatchObject({ ipCooldownSeconds: 60 });
  });

  it('limits the combined IP and account pair to five failures per window', async () => {
    for (let i = 0; i < 4; i += 1) await service.recordFailure('203.0.113.2', 'mobile:+919876543210');
    await service.recordFailure('203.0.113.2', 'mobile:+919876543210');
    await expect(service.inspect('203.0.113.2', 'mobile:+919876543210')).resolves.toMatchObject({ combinedCooldownSeconds: 30 });
  });

  it('clears account and combined failures after successful authentication but preserves IP failures', async () => {
    for (let i = 0; i < 4; i += 1) await service.recordFailure('203.0.113.3', 'email:ada@example.com');
    await service.recordSuccess('203.0.113.3', 'email:ada@example.com');
    await expect(service.inspect('203.0.113.3', 'email:ada@example.com')).resolves.toEqual({
      ipCooldownSeconds: 0,
      accountCooldownSeconds: 0,
      combinedCooldownSeconds: 0,
    });
    for (let i = 0; i < 16; i += 1) await service.recordFailure('203.0.113.3', `email:user${i}@example.com`);
    await expect(service.inspect('203.0.113.3', 'email:ada@example.com')).resolves.toMatchObject({ ipCooldownSeconds: 60 });
  });

  it('stores only HMAC-derived identifiers in Redis keys', async () => {
    await service.inspect('203.0.113.9', 'email:ada@example.com');
    const keys = redis.eval.mock.calls[0][1].keys;
    expect(keys.join(' ')).not.toContain('203.0.113.9');
    expect(keys.join(' ')).not.toContain('ada@example.com');
    expect(keys.every((key) => /^chocolate:login:v1:[a-z]+:[a-f0-9]{64}:cooldown$/.test(key))).toBe(true);
  });

  it('fails closed with a generic service error when Redis is unavailable', async () => {
    redis.eval.mockRejectedValue(new Error('private redis connection detail'));
    await expect(service.inspect('203.0.113.9', 'email:ada@example.com')).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(service.inspect('203.0.113.9', 'email:ada@example.com')).rejects.not.toThrow('private redis connection detail');
  });
});
