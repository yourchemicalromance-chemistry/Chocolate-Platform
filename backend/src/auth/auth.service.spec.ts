import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import type { SignupDto } from './dto/signup.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

const password = 'StrongPassword1!';

function validSignup(overrides: Partial<SignupDto> = {}): SignupDto {
  return {
    fullName: '  Ada   Lovelace  ',
    email: ' ADA.LOVELACE@EXAMPLE.COM ',
    mobileNumber: '98765 43210',
    password,
    dateOfBirth: '1990-12-10',
    is18PlusDeclared: true,
    ...overrides,
  };
}

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-uuid',
    fullName: 'Ada Lovelace',
    email: 'ada.lovelace@example.com',
    mobileNumber: '+919876543210',
    dateOfBirth: new Date('1990-12-10T00:00:00.000Z'),
    passwordHash: 'hash',
    is18PlusDeclared: true,
    ageDeclarationAt: new Date('2026-11-16T00:00:00.000Z'),
    createdAt: new Date('2026-11-16T00:00:00.000Z'),
    updatedAt: new Date('2026-11-16T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let jwt: { signAsync: ReturnType<typeof vi.fn> };
  let limiter: {
    inspect: ReturnType<typeof vi.fn>;
    recordFailure: ReturnType<typeof vi.fn>;
    recordSuccess: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      user: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
    };
    jwt = { signAsync: vi.fn().mockResolvedValue('signed-access-token') };
    limiter = {
      inspect: vi.fn().mockResolvedValue({ ipCooldownSeconds: 0, accountCooldownSeconds: 0, combinedCooldownSeconds: 0 }),
      recordFailure: vi.fn().mockResolvedValue(0),
      recordSuccess: vi.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      limiter as never,
    );
  });

  it('registers with normalized contacts, an Argon2id hash, and a signed token', async () => {
    prisma.user.create.mockImplementation(async ({ data }) => fakeUser(data));

    const result = await service.signup(validSignup());

    const savedData = prisma.user.create.mock.calls[0][0].data;
    expect(savedData).toMatchObject({
      fullName: 'Ada Lovelace',
      email: 'ada.lovelace@example.com',
      mobileNumber: '+919876543210',
      is18PlusDeclared: true,
    });
    expect(savedData.passwordHash).not.toBe(password);
    expect(savedData.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(savedData.passwordHash, password)).toBe(true);
    expect(result.accessToken).toBe('signed-access-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user).not.toHaveProperty('dateOfBirth');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-uuid', ver: 0 });
  });

  it('returns authoritative email verification state for a restored session', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'ada@example.com', emailVerified: false });
    await expect(service.getAccountStatus('user-uuid')).resolves.toEqual({ email: 'ada@example.com', emailVerified: false });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-uuid' }, select: { email: true, emailVerified: true } });
  });

  it.each(['email', 'mobileNumber'])(
    'returns a conflict when the database reports a duplicate %s',
    async () => {
      prisma.user.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.signup(validSignup())).rejects.toBeInstanceOf(
        ConflictException,
      );
    },
  );

  it.each([
    ['email', 'ada.lovelace@example.com'],
    ['mobile', '+91 98765 43210'],
  ])('logs in with a normalized %s identifier', async (_kind, identifier) => {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    prisma.user.findFirst.mockResolvedValue(fakeUser({ passwordHash }));

    const result = await service.login({
      identifier,
      password,
    } as LoginDto);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where:
        _kind === 'email'
          ? { email: 'ada.lovelace@example.com' }
          : { mobileNumber: '+919876543210' },
    });
    expect(result.accessToken).toBe('signed-access-token');
    expect(limiter.inspect).toHaveBeenCalledWith('unknown', _kind === 'email' ? 'email:ada.lovelace@example.com' : 'mobile:+919876543210');
    expect(limiter.recordSuccess).toHaveBeenCalledWith('unknown', _kind === 'email' ? 'email:ada.lovelace@example.com' : 'mobile:+919876543210');
  });

  it('rejects unknown accounts and incorrect passwords with the same error', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(
      service.login({ identifier: 'missing@example.com', password }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    prisma.user.findFirst.mockResolvedValue(fakeUser({ passwordHash }));
    await expect(
      service.login({
        identifier: 'ada.lovelace@example.com',
        password: 'IncorrectPassword1!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(limiter.recordFailure).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['email', ' ADA.LOVELACE@EXAMPLE.COM ', 'email:ada.lovelace@example.com'],
    ['mobile', '+91 98765 43210', 'mobile:+919876543210'],
  ])('normalizes %s identifiers for Redis rate limits', async (_kind, identifier, normalized) => {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    prisma.user.findFirst.mockResolvedValue(fakeUser({ passwordHash }));
    await service.login({ identifier, password } as LoginDto, '203.0.113.9');
    expect(limiter.inspect).toHaveBeenCalledWith('203.0.113.9', normalized);
    expect(limiter.recordSuccess).toHaveBeenCalledWith('203.0.113.9', normalized);
  });

  it('allows valid credentials during cooldown and clears the identifier counters', async () => {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    prisma.user.findFirst.mockResolvedValue(fakeUser({ passwordHash }));
    limiter.inspect.mockResolvedValue({ ipCooldownSeconds: 60, accountCooldownSeconds: 60, combinedCooldownSeconds: 30 });
    await expect(service.login({ identifier: 'ada.lovelace@example.com', password } as LoginDto, '203.0.113.9')).resolves.toMatchObject({ accessToken: 'signed-access-token' });
    expect(limiter.recordSuccess).toHaveBeenCalledWith('203.0.113.9', 'email:ada.lovelace@example.com');
  });

  it('allows a legitimate login after the Redis cooldown expires', async () => {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    prisma.user.findFirst.mockResolvedValue(fakeUser({ passwordHash }));
    limiter.inspect.mockResolvedValue({ ipCooldownSeconds: 0, accountCooldownSeconds: 0, combinedCooldownSeconds: 0 });
    await expect(service.login({ identifier: 'ada.lovelace@example.com', password } as LoginDto, '203.0.113.9')).resolves.toMatchObject({ accessToken: 'signed-access-token' });
    expect(limiter.recordSuccess).toHaveBeenCalledWith('203.0.113.9', 'email:ada.lovelace@example.com');
  });

  it('returns a temporary throttle after a cooldown has started', async () => {
    const { HttpStatus } = await import('@nestjs/common');
    prisma.user.findFirst.mockResolvedValue(null);
    limiter.inspect.mockResolvedValue({ ipCooldownSeconds: 0, accountCooldownSeconds: 60, combinedCooldownSeconds: 0 });
    await expect(service.login({ identifier: 'missing@example.com', password } as LoginDto, '203.0.113.9')).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    expect(limiter.recordFailure).not.toHaveBeenCalled();
  });

  it('rejects login for an account pending deletion', async () => {
    prisma.user.findFirst.mockResolvedValue(fakeUser({ accountStatus: 'PENDING_DELETION' }));
    await expect(service.login({ identifier: 'ada@example.com', password })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects underage registration before writing to the database', async () => {
    const underageDate = new Date();
    underageDate.setUTCFullYear(underageDate.getUTCFullYear() - 17);

    await expect(
      service.signup(
        validSignup({
          dateOfBirth: underageDate.toISOString().slice(0, 10),
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects registration without the 18+ declaration', async () => {
    await expect(
      service.signup(validSignup({ is18PlusDeclared: false })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
