import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtGuard } from './auth-jwt.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthJwtGuard', () => {
  const userId = '0f488798-d20e-4870-9eb7-5b1d8df2740a';
  let request: { headers: Record<string, string>; user?: { id: string } };
  let jwt: { verifyAsync: ReturnType<typeof vi.fn> };
  let guard: AuthJwtGuard;
  let prisma: { user: { findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    request = { headers: {} };
    jwt = { verifyAsync: vi.fn().mockResolvedValue({ sub: userId }) };
    prisma = { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0, accountStatus: 'ACTIVE' }) } };
    guard = new AuthJwtGuard(jwt as unknown as JwtService, prisma as unknown as PrismaService);
  });

  it('derives the account identity exclusively from the authenticated JWT', async () => {
    request.headers.authorization = 'Bearer signed-token';
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toEqual({ id: userId });
    expect(jwt.verifyAsync).toHaveBeenCalledWith('signed-token', { algorithms: ['HS256'] });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId }, select: { tokenVersion: true, accountStatus: true } });
  });

  it('rejects a previously issued token after its account token version changes', async () => {
    request.headers.authorization = 'Bearer old-token';
    jwt.verifyAsync.mockResolvedValue({ sub: userId, ver: 0 });
    prisma.user.findUnique.mockResolvedValue({ tokenVersion: 1, accountStatus: 'ACTIVE' });
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });

  it('accepts a new token carrying the current credential version', async () => {
    request.headers.authorization = 'Bearer current-token';
    jwt.verifyAsync.mockResolvedValue({ sub: userId, ver: 1 });
    prisma.user.findUnique.mockResolvedValue({ tokenVersion: 1, accountStatus: 'ACTIVE' });
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toEqual({ id: userId });
  });

  it('rejects tokens for accounts pending deletion', async () => {
    request.headers.authorization = 'Bearer signed-token';
    prisma.user.findUnique.mockResolvedValue({ tokenVersion: 0, accountStatus: 'PENDING_DELETION' });
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a missing token and never accepts a caller supplied user id', async () => {
    request.headers['x-user-id'] = userId;
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });

  function context(): ExecutionContext {
    return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  }
});
