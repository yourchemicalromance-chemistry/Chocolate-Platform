import { createHmac } from 'node:crypto';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { OtpService } from './otp.service.js';
import { EmailOtpDelivery, UnconfiguredSmsOtpProvider } from './otp-delivery.js';
import { PrismaService } from '../prisma/prisma.service.js';

const userId = '0f488798-d20e-4870-9eb7-5b1d8df2740a';
const hashSecret = '0123456789abcdef0123456789abcdef';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: any;
  let tx: any;
  let delivery: { send: ReturnType<typeof vi.fn> };
  let sms: { send: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    process.env.OTP_HASH_SECRET = hashSecret;
    delivery = { send: vi.fn().mockResolvedValue(undefined) };
    sms = { send: vi.fn().mockResolvedValue(undefined) };
    tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      otpChallenge: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'challenge-id' }),
      },
      passwordResetToken: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'reset-token-id' }),
      },
    };
    prisma = {
      $transaction: vi.fn((callback: (client: unknown) => unknown) => callback(tx)),
      user: {
        findUnique: vi.fn().mockResolvedValue({ email: 'ada@example.com', mobileNumber: '+919876543210', emailVerified: false, accountStatus: 'ACTIVE' }),
        findFirst: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      otpChallenge: {
        findFirst: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new OtpService(prisma as PrismaService, delivery as unknown as EmailOtpDelivery, sms as unknown as UnconfiguredSmsOtpProvider);
  });

  afterEach(() => {
    delete process.env.OTP_HASH_SECRET;
  });

  it('issues six digits, persists only an HMAC, and delivers the email code', async () => {
    const result = await service.sendEmail(userId);
    expect(result).toEqual({ status: 'sent', expiresInSeconds: 600, resendAfterSeconds: 60 });
    expect(delivery.send).toHaveBeenCalledWith('ada@example.com', expect.stringMatching(/^\d{6}$/));
    expect(tx.otpChallenge.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ otpHash: expect.stringMatching(/^[a-f0-9]{64}$/) }) }));
    expect(tx.otpChallenge.create.mock.calls[0][0].data.otpHash).not.toBe(delivery.send.mock.calls[0][1]);
  });

  it.each([
    ['email', ' ADA@example.com ', { email: 'ada@example.com' }],
    ['mobile', '+91 98765 43210', { mobileNumber: '+919876543210' }],
  ])('sends a recovery OTP for a registered %s to the account email only', async (_kind, identifier, where) => {
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    await expect(service.requestPasswordReset(identifier)).resolves.toMatchObject({ resendAfterSeconds: 60 });
    expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(delivery.send).toHaveBeenCalledWith('ada@example.com', expect.stringMatching(/^\d{6}$/), 'PASSWORD_RESET');
    expect(sms.send).not.toHaveBeenCalled();
    expect(tx.otpChallenge.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ purpose: 'PASSWORD_RESET', channel: 'EMAIL', otpHash: expect.not.stringMatching(/^\d{6}$/) }),
    }));
  });

  it('returns the same generic recovery response for an unknown account', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.requestPasswordReset('missing@example.com')).resolves.toEqual({
      message: 'If an account matches, a recovery code will be sent to its registered email address.',
      expiresInSeconds: 600,
      resendAfterSeconds: 60,
    });
    expect(delivery.send).not.toHaveBeenCalled();
    expect(sms.send).not.toHaveBeenCalled();
  });

  it('keeps recovery rate-limit responses generic and applies the account cooldown', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    tx.otpChallenge.findMany.mockResolvedValue([{ createdAt: new Date() }]);
    await expect(service.requestPasswordReset('ada@example.com')).resolves.toMatchObject({
      message: 'If an account matches, a recovery code will be sent to its registered email address.',
    });
    expect(tx.otpChallenge.create).not.toHaveBeenCalled();
    expect(delivery.send).not.toHaveBeenCalled();
  });

  it('enforces five recovery sends per account per hour', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    tx.otpChallenge.findMany.mockResolvedValue(Array.from({ length: 5 }, (_, index) => ({
      createdAt: new Date(Date.now() - (index + 2) * 60_000),
    })));
    await expect(service.requestPasswordReset('+91 98765 43210')).resolves.toMatchObject({
      message: 'If an account matches, a recovery code will be sent to its registered email address.',
    });
    expect(tx.otpChallenge.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ purpose: 'PASSWORD_RESET', channel: 'EMAIL' }),
    }));
    expect(tx.otpChallenge.create).not.toHaveBeenCalled();
    expect(delivery.send).not.toHaveBeenCalled();
  });

  it('purpose-separates recovery OTPs and issues a one-time reset token after verification', async () => {
    const code = '041927';
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'challenge-id', userId, purpose: 'PASSWORD_RESET', status: 'PENDING', attempts: 0,
      expiresAt: new Date(Date.now() + 60_000), otpHash: recoveryHmac(userId, code),
    });
    const result = await service.verifyPasswordResetOtp('ada@example.com', code);
    expect(result.resetToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(prisma.otpChallenge.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ purpose: 'PASSWORD_RESET' }) }));
    expect(tx.passwordResetToken.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId, tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }) }));
    expect(tx.passwordResetToken.create.mock.calls[0][0].data.tokenHash).not.toBe(result.resetToken);
  });

  it('does not allow onboarding OTP purpose to verify a recovery code', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    prisma.otpChallenge.findFirst.mockResolvedValue(null);
    await expect(service.verifyPasswordResetOtp('ada@example.com', '041927')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.passwordResetToken).toBeUndefined();
  });

  it('counts bad recovery codes and enforces the five-attempt limit', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'recovery-challenge', purpose: 'PASSWORD_RESET', attempts: 0,
      expiresAt: new Date(Date.now() + 60_000), otpHash: recoveryHmac(userId, '111111'),
    });
    await expect(service.verifyPasswordResetOtp('ada@example.com', '222222')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'recovery-challenge', attempts: { lt: 5 } }),
      data: { attempts: { increment: 1 } },
    }));
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'recovery-challenge', purpose: 'PASSWORD_RESET', attempts: 5,
      expiresAt: new Date(Date.now() + 60_000), otpHash: recoveryHmac(userId, '041927'),
    });
    await expect(service.verifyPasswordResetOtp('ada@example.com', '041927')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects expired and reused recovery OTPs', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'expired', purpose: 'PASSWORD_RESET', attempts: 0,
      expiresAt: new Date(Date.now() - 1), otpHash: recoveryHmac(userId, '041927'),
    });
    await expect(service.verifyPasswordResetOtp('ada@example.com', '041927')).rejects.toBeInstanceOf(UnauthorizedException);
    prisma.otpChallenge.findFirst.mockResolvedValue(null);
    await expect(service.verifyPasswordResetOtp('ada@example.com', '041927')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('consumes a correct code once and marks the account email verified', async () => {
    const code = '041927';
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'challenge-id', userId, channel: 'EMAIL', status: 'PENDING', attempts: 0,
      expiresAt: new Date(Date.now() + 60_000), otpHash: hmac(userId, 'EMAIL', code),
    });
    await expect(service.verifyEmail(userId, code)).resolves.toEqual({ verified: true, emailVerified: true });
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CONSUMED' }) }));
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: userId }, data: { emailVerified: true } });
  });

  it('rejects invalid codes and increments the persisted attempt counter', async () => {
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'challenge-id', attempts: 0, expiresAt: new Date(Date.now() + 60_000), otpHash: hmac(userId, 'EMAIL', '111111'),
    });
    await expect(service.verifyEmail(userId, '222222')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { attempts: { increment: 1 } } }));
  });

  it.each([
    ['expired', { expiresAt: new Date(Date.now() - 1), attempts: 0 }],
    ['attempt-limited', { expiresAt: new Date(Date.now() + 60_000), attempts: 5 }],
  ])('rejects an %s challenge', async (_label, fields) => {
    prisma.otpChallenge.findFirst.mockResolvedValue({ id: 'challenge-id', otpHash: hmac(userId, 'EMAIL', '041927'), ...fields });
    await expect(service.verifyEmail(userId, '041927')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects reused codes because consumed records are not pending', async () => {
    prisma.otpChallenge.findFirst.mockResolvedValue(null);
    await expect(service.verifyEmail(userId, '041927')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('enforces cooldown and hourly resend limits in database-backed history', async () => {
    tx.otpChallenge.findMany.mockResolvedValue([{ createdAt: new Date() }]);
    await expect(service.sendEmail(userId)).rejects.toMatchObject({ status: 429 });
    expect(tx.otpChallenge.create).not.toHaveBeenCalled();
  });

  it('caps new OTP challenges at five per hour', async () => {
    tx.otpChallenge.findMany.mockResolvedValue(Array.from({ length: 5 }, (_, index) => ({ createdAt: new Date(Date.now() - (index + 2) * 60_000) })));
    await expect(service.sendEmail(userId)).rejects.toMatchObject({ status: 429 });
    expect(tx.otpChallenge.create).not.toHaveBeenCalled();
  });

  it('invalidates an OTP if SMTP delivery fails', async () => {
    delivery.send.mockRejectedValue(new ServiceUnavailableException('Email delivery is not configured.'));
    await expect(service.sendEmail(userId)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'INVALIDATED' } }));
  });

  it('invalidates password recovery challenges when SMTP delivery fails', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: userId, email: 'ada@example.com', accountStatus: 'ACTIVE' });
    delivery.send.mockRejectedValue(new ServiceUnavailableException('Email delivery is temporarily unavailable.'));
    await expect(service.requestPasswordReset('ada@example.com')).resolves.toMatchObject({
      message: 'If an account matches, a recovery code will be sent to its registered email address.',
    });
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith({
      where: { id: 'challenge-id', status: 'PENDING' }, data: { status: 'INVALIDATED' },
    });
  });

  it('returns provider-not-configured for mobile delivery and invalidates its challenge', async () => {
    sms.send.mockRejectedValue(new ServiceUnavailableException('Mobile OTP delivery is not configured.'));
    await expect(service.sendMobile(userId)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(sms.send).toHaveBeenCalledWith('+919876543210', expect.stringMatching(/^\d{6}$/));
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'INVALIDATED' } }));
  });

  it('marks mobile verified only after a correct SMS challenge is consumed', async () => {
    const code = '780514';
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'mobile-challenge', userId, channel: 'MOBILE', status: 'PENDING', attempts: 0,
      expiresAt: new Date(Date.now() + 60_000), otpHash: hmac(userId, 'MOBILE', code),
    });
    await expect(service.verifyMobile(userId, code)).resolves.toEqual({ verified: true });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: userId }, data: { mobileVerified: true } });
  });
});

function hmac(id: string, channel: string, code: string): string {
  return createHmac('sha256', hashSecret).update(`${id}:${channel}:${code}`).digest('hex');
}

function recoveryHmac(id: string, code: string): string {
  return createHmac('sha256', hashSecret).update(`${id}:EMAIL:PASSWORD_RESET:${code}`).digest('hex');
}
