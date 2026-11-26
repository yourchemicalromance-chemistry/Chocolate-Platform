import { createHmac, randomUUID } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { config as loadDotenv } from 'dotenv';
import { createClient } from 'redis';
import { AuthService } from './auth.service.js';
import { LoginRateLimitService } from './login-rate-limit.service.js';

// Compose supplies credentials from the repository .env; backend/.env provides app settings.
loadDotenv({ path: '../.env', quiet: true });
loadDotenv({ path: '.env', quiet: true });

const enabled = process.env.CHOCOLATE_REDIS_INTEGRATION === '1';

describe.skipIf(!enabled)('Login rate limit Redis integration', () => {
  it(
    'enforces login thresholds across clients, expires cooldown, resets on success, and fails closed',
    async () => {
      const secret = process.env.JWT_SECRET;
      if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
        throw new Error('A valid JWT_SECRET must be configured for this opt-in integration test.');
      }
      if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
        throw new Error('The existing Redis connection configuration is required.');
      }

      const email = `codex-integration-${randomUUID()}@invalid.example`;
      const clientIp = `198.51.100.${Math.floor(Math.random() * 254) + 1}`;
      const identifier = `email:${email}`;
      const deriveKey = (scope: string, value: string) => {
        const digest = createHmac('sha256', secret)
          .update(`chocolate-login:${scope}:${value}`)
          .digest('hex');
        return `chocolate:login:v1:${scope}:${digest}`;
      };
      const keys: string[] = [];
      for (const [scope, value] of [
        ['ip', clientIp],
        ['account', identifier],
        ['combined', `${clientIp}\0${identifier}`],
      ]) {
        const base = deriveKey(scope, value);
        keys.push(`${base}:count`, `${base}:cooldown`, `${base}:streak`);
      }

      const redis = createClient({
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT ?? '6379'),
          connectTimeout: 2_000,
          reconnectStrategy: false,
        },
        password: process.env.REDIS_PASSWORD,
        disableOfflineQueue: true,
      });
      redis.on('error', () => undefined);

      const serviceA = new LoginRateLimitService();
      const serviceB = new LoginRateLimitService();
      let databaseUser: Record<string, unknown> | null = null;
      const prisma = { user: { findFirst: async () => databaseUser } };
      const jwt = { signAsync: async () => 'synthetic-test-token' };
      const authA = new AuthService(prisma as never, jwt as never, serviceA);
      const authB = new AuthService(prisma as never, jwt as never, serviceB);
      let ownsKeys = false;

      const loginStatus = async (auth: AuthService, password: string) => {
        try {
          await auth.login({ identifier: email, password }, clientIp);
          return 200;
        } catch (error) {
          return error instanceof Error && 'getStatus' in error
            ? (error as Error & { getStatus(): number }).getStatus()
            : 500;
        }
      };

      try {
        await redis.connect();
        expect((await redis.mGet(keys)).every((value) => value === null)).toBe(true);
        ownsKeys = true;

        const validPassword = 'Synthetic-Test-Pass-42!';
        const passwordHash = await argon2.hash(validPassword, { type: argon2.argon2id });
        const failedStatuses: number[] = [];
        for (let i = 0; i < 5; i += 1) {
          failedStatuses.push(await loginStatus(i % 2 === 0 ? authA : authB, 'invalid'));
        }
        expect(failedStatuses).toEqual([401, 401, 401, 401, 401]);
        expect(await loginStatus(authB, 'invalid')).toBe(429);

        expect(await redis.mGet([keys[0], keys[3], keys[6]])).toEqual(['5', '5', '5']);
        const counterTtl = await redis.ttl(keys[0]);
        const cooldownTtl = await redis.ttl(keys[4]);
        expect(counterTtl).toBeGreaterThan(890);
        expect(counterTtl).toBeLessThanOrEqual(900);
        expect(cooldownTtl).toBeGreaterThan(45);
        expect(cooldownTtl).toBeLessThanOrEqual(60);
        const stateA = await serviceA.inspect(clientIp, identifier);
        const stateB = await serviceB.inspect(clientIp, identifier);
        expect(stateA.accountCooldownSeconds).toBeGreaterThan(0);
        expect(stateB.accountCooldownSeconds).toBeGreaterThan(0);

        let cooldownExpired = false;
        const expiryDeadline = Date.now() + 75_000;
        while (Date.now() < expiryDeadline) {
          if ((await serviceA.inspect(clientIp, identifier)).accountCooldownSeconds === 0) {
            cooldownExpired = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1_000));
        }
        expect(cooldownExpired).toBe(true);
        expect(await loginStatus(authA, 'invalid')).toBe(401);

        databaseUser = {
          id: randomUUID(),
          fullName: 'Synthetic Test',
          email,
          mobileNumber: '+12025550123',
          emailVerified: false,
          tokenVersion: 0,
          accountStatus: 'ACTIVE',
          passwordHash,
        };
        expect(await loginStatus(authB, validPassword)).toBe(200);
        expect((await redis.mGet(keys.slice(3))).every((value) => value === null)).toBe(true);
        expect(await redis.get(keys[0])).toBe('6');

        const originalPort = process.env.REDIS_PORT;
        let unavailableService: LoginRateLimitService | undefined;
        let unavailableStatus = 0;
        try {
          process.env.REDIS_PORT = '1';
          unavailableService = new LoginRateLimitService();
          try {
            await unavailableService.inspect(clientIp, identifier);
          } catch (error) {
            if (error instanceof ServiceUnavailableException) unavailableStatus = error.getStatus();
          }
        } finally {
          await unavailableService?.onModuleDestroy();
          if (originalPort === undefined) delete process.env.REDIS_PORT;
          else process.env.REDIS_PORT = originalPort;
        }
        expect(unavailableStatus).toBe(503);
      } finally {
        if (ownsKeys && redis.isOpen) await redis.del(keys);
        if (redis.isOpen) await redis.quit();
        await serviceA.onModuleDestroy();
        await serviceB.onModuleDestroy();
      }
    },
    120_000,
  );
});
