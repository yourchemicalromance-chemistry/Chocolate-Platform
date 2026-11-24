import { createHmac } from 'node:crypto';
import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { createClient } from 'redis';

const WINDOW_SECONDS = 15 * 60;
const STREAK_TTL_SECONDS = 24 * 60 * 60;
const MAX_COOLDOWN_SECONDS = 15 * 60;

const CHECK_SCRIPT = `
return {
  math.max(0, redis.call('PTTL', KEYS[1])),
  math.max(0, redis.call('PTTL', KEYS[2])),
  math.max(0, redis.call('PTTL', KEYS[3]))
}`;

const FAILURE_SCRIPT = `
local limits = { tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4]) }
local bases = { tonumber(ARGV[5]), tonumber(ARGV[6]), tonumber(ARGV[7]) }
local maxCooldown = tonumber(ARGV[8])
local streakTtl = tonumber(ARGV[9])
local maxActive = 0
for i = 1, 3 do
  local counter = KEYS[i]
  local cooldown = KEYS[i + 3]
  local streakKey = KEYS[i + 6]
  local remaining = redis.call('PTTL', cooldown)
  if remaining <= 0 then
    local count = redis.call('INCR', counter)
    if count == 1 then redis.call('EXPIRE', counter, tonumber(ARGV[1])) end
    if count >= limits[i] and redis.call('EXISTS', cooldown) == 0 then
      local streak = redis.call('INCR', streakKey)
      if streak == 1 then redis.call('EXPIRE', streakKey, streakTtl) end
      local multiplier = 2 ^ math.min(streak - 1, 10)
      local duration = math.min(bases[i] * multiplier, maxCooldown)
      redis.call('SET', cooldown, '1', 'EX', duration)
      remaining = duration * 1000
    end
  end
  if remaining > maxActive then maxActive = remaining end
end
return maxActive
`;

const RESET_SCRIPT = `
return redis.call('DEL', unpack(KEYS))
`;

type RedisLoginClient = {
  isOpen: boolean;
  on(event: 'error', listener: (error: Error) => void): unknown;
  connect(): Promise<unknown>;
  eval(script: string, options: { keys: string[]; arguments: string[] }): Promise<unknown>;
  quit(): Promise<unknown>;
};

export type LoginRateState = {
  ipCooldownSeconds: number;
  accountCooldownSeconds: number;
  combinedCooldownSeconds: number;
};

@Injectable()
export class LoginRateLimitService implements OnModuleDestroy {
  private readonly client: RedisLoginClient;
  private connecting: Promise<void> | null = null;

  constructor() {
    const client = createClient({
      socket: {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? '6379'),
        connectTimeout: 2_000,
        reconnectStrategy: false,
      },
      password: process.env.REDIS_PASSWORD || undefined,
      disableOfflineQueue: true,
    });
    client.on('error', () => undefined);
    this.client = client as unknown as RedisLoginClient;
  }

  async inspect(clientIp: string, normalizedIdentifier: string): Promise<LoginRateState> {
    const ip = this.key('ip', clientIp);
    const account = this.key('account', normalizedIdentifier);
    const combined = this.key('combined', `${clientIp}\0${normalizedIdentifier}`);
    const result = await this.execute(CHECK_SCRIPT, [
      this.cooldown(ip), this.cooldown(account), this.cooldown(combined),
    ], []);
    if (!Array.isArray(result) || result.length !== 3) throw new Error('Invalid Redis rate-limit response.');
    return {
      ipCooldownSeconds: this.toSeconds(result[0]),
      accountCooldownSeconds: this.toSeconds(result[1]),
      combinedCooldownSeconds: this.toSeconds(result[2]),
    };
  }

  async recordFailure(clientIp: string, normalizedIdentifier: string): Promise<number> {
    const ip = this.key('ip', clientIp);
    const account = this.key('account', normalizedIdentifier);
    const combined = this.key('combined', `${clientIp}\0${normalizedIdentifier}`);
    const result = await this.execute(FAILURE_SCRIPT, [
      this.counter(account), this.counter(ip), this.counter(combined),
      this.cooldown(account), this.cooldown(ip), this.cooldown(combined),
      this.streak(account), this.streak(ip), this.streak(combined),
    ], [
      String(WINDOW_SECONDS), '5', '20', '5',
      '60', '60', '30', String(MAX_COOLDOWN_SECONDS), String(STREAK_TTL_SECONDS),
    ]);
    return this.toSeconds(result);
  }

  async recordSuccess(clientIp: string, normalizedIdentifier: string): Promise<void> {
    const account = this.key('account', normalizedIdentifier);
    const combined = this.key('combined', `${clientIp}\0${normalizedIdentifier}`);
    await this.execute(RESET_SCRIPT, [
      this.counter(account), this.cooldown(account), this.streak(account),
      this.counter(combined), this.cooldown(combined), this.streak(combined),
    ], []);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.quit().catch(() => undefined);
  }

  private async execute(script: string, keys: string[], args: string[]): Promise<unknown> {
    try {
      await this.connect();
      return await this.client.eval(script, { keys, arguments: args });
    } catch {
      // Fail closed: do not silently disable login protection during Redis outages.
      throw new ServiceUnavailableException('Authentication is temporarily unavailable.');
    }
  }

  private async connect(): Promise<void> {
    if (this.client.isOpen) return;
    if (!this.connecting) {
      this.connecting = this.client.connect().then(() => undefined).finally(() => {
        this.connecting = null;
      });
    }
    await this.connecting;
  }

  private key(scope: string, value: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new ServiceUnavailableException('Authentication is temporarily unavailable.');
    }
    const digest = createHmac('sha256', secret).update(`chocolate-login:${scope}:${value}`).digest('hex');
    return `chocolate:login:v1:${scope}:${digest}`;
  }

  private counter(key: string): string { return `${key}:count`; }
  private cooldown(key: string): string { return `${key}:cooldown`; }
  private streak(key: string): string { return `${key}:streak`; }

  private toSeconds(value: unknown): number {
    const milliseconds = Number(value);
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return 0;
    return Math.ceil(milliseconds / 1000);
  }
}
