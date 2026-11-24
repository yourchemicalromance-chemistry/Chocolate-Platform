import { createHmac } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { createClient } from 'redis';

const LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) end
if count > tonumber(ARGV[2]) then return {0, redis.call('TTL', KEYS[1])} end
return {1, 0}
`;
const ORIGIN_SCRIPT = `
local inserted = redis.call('SADD', KEYS[1], ARGV[1])
if inserted == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1 + 1])) end
local count = redis.call('SCARD', KEYS[1])
if count > tonumber(ARGV[3]) then return {0, count} end
return {1, count}
`;

type RedisDiscoveryClient = {
  isOpen: boolean;
  on(event: 'error', listener: (error: Error) => void): unknown;
  connect(): Promise<unknown>;
  eval(script: string, options: { keys: string[]; arguments: string[] }): Promise<unknown>;
  quit(): Promise<unknown>;
};

@Injectable()
export class DiscoveryRateLimitService implements OnModuleDestroy {
  private readonly client: RedisDiscoveryClient;
  private connecting: Promise<void> | null = null;

  constructor() {
    const client = createClient({
      socket: { host: process.env.REDIS_HOST ?? '127.0.0.1', port: Number(process.env.REDIS_PORT ?? '6379'), connectTimeout: 2_000, reconnectStrategy: false },
      password: process.env.REDIS_PASSWORD || undefined,
      disableOfflineQueue: true,
    });
    client.on('error', () => undefined);
    this.client = client as unknown as RedisDiscoveryClient;
  }

  async consume(userId: string, scope: string, limit: number, windowSeconds: number): Promise<void> {
    const key = `chocolate:discovery:limit:${this.digest(`${userId}:${scope}`)}`;
    const result = await this.eval(LIMIT_SCRIPT, [key], [String(windowSeconds), String(limit)]);
    if (!Array.isArray(result) || Number(result[0]) !== 1) {
      throw new HttpException('Too many discovery requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async consumeOrigin(userId: string, latitude: number, longitude: number): Promise<void> {
    // Match the 0.01 degree coordinate quantization used for persisted search origins.
    const cell = `${coarsenDiscoveryCoordinate(latitude).toFixed(2)}:${coarsenDiscoveryCoordinate(longitude).toFixed(2)}`;
    const key = `chocolate:discovery:origins:${this.digest(userId)}`;
    const result = await this.eval(ORIGIN_SCRIPT, [key], [cell, '86400', '4']);
    if (!Array.isArray(result) || Number(result[0]) !== 1) {
      throw new HttpException('Daily location-search limit reached.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.quit().catch(() => undefined);
  }

  private async eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    try {
      await this.connect();
      return await this.client.eval(script, { keys, arguments: args });
    } catch {
      // A Redis outage must not disable discovery abuse controls.
      throw new ServiceUnavailableException('Discovery is temporarily unavailable.');
    }
  }

  private async connect(): Promise<void> {
    if (this.client.isOpen) return;
    if (!this.connecting) this.connecting = this.client.connect().then(() => undefined).finally(() => { this.connecting = null; });
    await this.connecting;
  }

  private digest(value: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) throw new ServiceUnavailableException('Discovery is temporarily unavailable.');
    return createHmac('sha256', secret).update(`chocolate-discovery:${value}`).digest('hex');
  }
}

export function coarsenDiscoveryCoordinate(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value) * 100) / 100;
}
