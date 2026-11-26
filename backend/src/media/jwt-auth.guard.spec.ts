import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';

describe('JwtAuthGuard', () => {
  it('attaches the verified subject to the request', async () => {
    const request: any = { headers: { authorization: 'Bearer signed-token' } };
    const jwt = { verifyAsync: vi.fn().mockResolvedValue({ sub: '4f33c81c-a542-4b14-8c85-8dd1a6b9a09a' }) };
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0, accountStatus: 'ACTIVE' }) } };
    const context: any = { switchToHttp: () => ({ getRequest: () => request }) };
    const guard = new JwtAuthGuard(jwt as unknown as JwtService, prisma as unknown as PrismaService);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('signed-token', { algorithms: ['HS256'] });
    expect(request.user.id).toBe('4f33c81c-a542-4b14-8c85-8dd1a6b9a09a');
  });

  it('rejects absent and invalid bearer credentials', async () => {
    const jwt = { verifyAsync: vi.fn().mockRejectedValue(new Error('invalid')) };
    const prisma = { user: { findUnique: vi.fn() } };
    const guard = new JwtAuthGuard(jwt as unknown as JwtService, prisma as unknown as PrismaService);
    const makeContext = (authorization?: string) => ({
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
    }) as any;

    await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(makeContext('Bearer invalid'))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an old access token after password reset increments its token version', async () => {
    const request: any = { headers: { authorization: 'Bearer old-token' } };
    const jwt = { verifyAsync: vi.fn().mockResolvedValue({ sub: '4f33c81c-a542-4b14-8c85-8dd1a6b9a09a', ver: 0 }) };
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 1, accountStatus: 'ACTIVE' }) } };
    const guard = new JwtAuthGuard(jwt as unknown as JwtService, prisma as unknown as PrismaService);
    await expect(guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) } as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
