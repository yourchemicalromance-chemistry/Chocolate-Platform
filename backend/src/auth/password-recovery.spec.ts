import { createHash } from 'node:crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthJwtGuard } from './auth-jwt.guard.js';

describe('password recovery', () => {
  const resetToken = 'A'.repeat(43);
  const userId = '0f488798-d20e-4870-9eb7-5b1d8df2740a';
  const newPassword = 'NewStrongPassword2!';
  let service: AuthService;
  let jwt: { signAsync: ReturnType<typeof vi.fn> };
  let prisma: any;
  let tx: any;

  beforeEach(() => {
    tx = {
      passwordResetToken: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: vi.fn().mockResolvedValue({}) },
    };
    prisma = {
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue({ id: 'token-id', userId }),
      },
      user: { update: vi.fn(), findFirst: vi.fn() },
      $transaction: vi.fn((callback: (client: unknown) => unknown) => callback(tx)),
    };
    jwt = { signAsync: vi.fn().mockResolvedValue('jwt') };
    service = new AuthService(prisma as PrismaService, jwt as unknown as JwtService, {
      inspect: vi.fn().mockResolvedValue({ ipCooldownSeconds: 0, accountCooldownSeconds: 0, combinedCooldownSeconds: 0 }),
      recordFailure: vi.fn().mockResolvedValue(0),
      recordSuccess: vi.fn().mockResolvedValue(undefined),
    } as any);
  });

  it('rejects a password mismatch without consuming a reset token', async () => {
    await expect(service.resetPassword({ resetToken, newPassword, confirmPassword: 'DifferentPassword2!' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.passwordResetToken.findFirst).not.toHaveBeenCalled();
  });

  it('rejects an expired or reused reset token', async () => {
    prisma.passwordResetToken.findFirst.mockResolvedValue(null);
    await expect(service.resetPassword({ resetToken, newPassword, confirmPassword: newPassword })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('hashes and updates the new password while atomically consuming the reset token', async () => {
    await expect(service.resetPassword({ resetToken, newPassword, confirmPassword: newPassword })).resolves.toEqual({ passwordReset: true });
    expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith({
      where: { tokenHash: createHash('sha256').update(resetToken).digest('hex'), usedAt: null, expiresAt: { gt: expect.any(Date) } },
      select: { id: true, userId: true },
    });
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'token-id', usedAt: null, expiresAt: { gt: expect.any(Date) } } }));
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: userId },
      data: { passwordHash: expect.any(String), tokenVersion: { increment: 1 } },
    }));
    const passwordHash = tx.user.update.mock.calls[0][0].data.passwordHash as string;
    expect(passwordHash).not.toBe(newPassword);
    await expect(argon2.verify(passwordHash, newPassword)).resolves.toBe(true);

    prisma.user.findFirst.mockResolvedValue({
      id: userId, fullName: 'Ada', email: 'ada@example.com', mobileNumber: '+919876543210',
      emailVerified: true, accountStatus: 'ACTIVE', passwordHash, tokenVersion: 1,
    });
    await expect(service.login({ identifier: 'ada@example.com', password: newPassword })).resolves.toMatchObject({ accessToken: 'jwt' });
    await expect(service.login({ identifier: '+91 98765 43210', password: newPassword })).resolves.toMatchObject({ accessToken: 'jwt' });
    expect(jwt.signAsync).toHaveBeenNthCalledWith(1, { sub: userId, ver: 1 });
    expect(jwt.signAsync).toHaveBeenNthCalledWith(2, { sub: userId, ver: 1 });

    const oldRequest = { headers: { authorization: 'Bearer pre-reset-token' } };
    const oldTokenGuard = new AuthJwtGuard(
      { verifyAsync: vi.fn().mockResolvedValue({ sub: userId, ver: 0 }) } as unknown as JwtService,
      { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 1, accountStatus: 'ACTIVE' }) } } as unknown as PrismaService,
    );
    await expect(oldTokenGuard.canActivate({ switchToHttp: () => ({ getRequest: () => oldRequest }) } as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects token reuse if another request consumed it concurrently', async () => {
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.resetPassword({ resetToken, newPassword, confirmPassword: newPassword })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
