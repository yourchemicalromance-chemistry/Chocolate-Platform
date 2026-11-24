import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailOtpDelivery, SMS_OTP_PROVIDER, type SmsOtpProvider } from './otp-delivery.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ISSUES_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const PASSWORD_RESET_PURPOSE = 'PASSWORD_RESET' as const;
const GENERIC_RECOVERY_RESPONSE = {
  message: 'If an account matches, a recovery code will be sent to its registered email address.',
  expiresInSeconds: 600,
  resendAfterSeconds: 60,
};

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDelivery: EmailOtpDelivery,
    @Inject(SMS_OTP_PROVIDER) private readonly smsProvider: SmsOtpProvider,
  ) {}

  async sendEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true, accountStatus: true } });
    if (!user || user.accountStatus === 'PENDING_DELETION') throw new UnauthorizedException('Authentication is required.');
    if (user.emailVerified) return { status: 'already_verified' as const, resendAfterSeconds: 0 };
    const { id, code } = await this.issue(userId, 'EMAIL');
    try {
      await this.emailDelivery.send(user.email, code);
    } catch (error) {
      await this.prisma.otpChallenge.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'INVALIDATED' } });
      throw error;
    }
    return { status: 'sent' as const, expiresInSeconds: 600, resendAfterSeconds: 60 };
  }

  async resendEmail(userId: string) {
    return this.sendEmail(userId);
  }

  async verifyEmail(userId: string, code: string) {
    await this.verify(userId, 'EMAIL', code);
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    return { verified: true, emailVerified: true };
  }

  async sendMobile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { mobileNumber: true, accountStatus: true } });
    if (!user || user.accountStatus === 'PENDING_DELETION') throw new UnauthorizedException('Authentication is required.');
    const { id, code } = await this.issue(userId, 'MOBILE');
    try {
      await this.smsProvider.send(user.mobileNumber, code);
    } catch (error) {
      await this.prisma.otpChallenge.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'INVALIDATED' } });
      throw error;
    }
    return { status: 'sent' as const, expiresInSeconds: 600, resendAfterSeconds: 60 };
  }

  async verifyMobile(userId: string, code: string) {
    await this.verify(userId, 'MOBILE', code);
    await this.prisma.user.update({ where: { id: userId }, data: { mobileVerified: true } });
    return { verified: true };
  }

  async requestPasswordReset(identifier: string) {
    const user = await this.findRecoveryUser(identifier);
    if (user && user.accountStatus !== 'PENDING_DELETION') {
      let challengeId: string | undefined;
      try {
        const { id, code } = await this.issue(user.id, 'EMAIL', PASSWORD_RESET_PURPOSE);
        challengeId = id;
        await this.emailDelivery.send(user.email, code, 'PASSWORD_RESET');
      } catch {
        if (challengeId) {
          await this.prisma.otpChallenge.updateMany({
            where: { id: challengeId, status: 'PENDING' },
            data: { status: 'INVALIDATED' },
          }).catch(() => undefined);
        }
        // Keep the public response identical for unknown accounts and delivery failures.
      }
    }
    return GENERIC_RECOVERY_RESPONSE;
  }

  async verifyPasswordResetOtp(identifier: string, code: string) {
    const user = await this.findRecoveryUser(identifier);
    if (!user || user.accountStatus === 'PENDING_DELETION') {
      throw new UnauthorizedException('The code is invalid or expired.');
    }
    await this.verify(user.id, 'EMAIL', code, PASSWORD_RESET_PURPOSE);
    const resetToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });
      await tx.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + 15 * 60 * 1000) },
        select: { id: true },
      });
    });
    return { resetToken, expiresInSeconds: 900 };
  }

  private async findRecoveryUser(identifier: string) {
    const normalized = identifier.trim();
    if (normalized.includes('@')) {
      return this.prisma.user.findFirst({
        where: { email: normalized.toLowerCase() },
        select: { id: true, email: true, accountStatus: true },
      });
    }
    try {
      const phone = parsePhoneNumberFromString(normalized, 'IN');
      if (!phone?.isValid()) return null;
      return this.prisma.user.findFirst({
        where: { mobileNumber: phone.number },
        select: { id: true, email: true, accountStatus: true },
      });
    } catch {
      return null;
    }
  }

  private hash(userId: string, channel: 'EMAIL' | 'MOBILE', code: string, purpose?: typeof PASSWORD_RESET_PURPOSE): Buffer {
    const secret = process.env.OTP_HASH_SECRET;
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) throw new Error('OTP_HASH_SECRET must be configured with at least 32 bytes.');
    const payload = purpose
      ? `${userId}:${channel}:${purpose}:${code}`
      : `${userId}:${channel}:${code}`;
    return createHmac('sha256', secret).update(payload).digest();
  }

  private async issue(userId: string, channel: 'EMAIL' | 'MOBILE', purpose?: typeof PASSWORD_RESET_PURPOSE) {
    const now = new Date();
    const code = String(randomInt(100000, 1000000));
    const otpHash = this.hash(userId, channel, code, purpose).toString('hex');
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      const recent = await tx.otpChallenge.findMany({
        where: { userId, channel, purpose: purpose ?? 'EMAIL_VERIFICATION', createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' }, take: MAX_ISSUES_PER_HOUR,
        select: { createdAt: true },
      });
      if (recent[0] && now.getTime() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
        throw new HttpException('Please wait before requesting another code.', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (recent.length >= MAX_ISSUES_PER_HOUR) throw new HttpException('Too many codes requested. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
      await tx.otpChallenge.updateMany({ where: { userId, channel, purpose: purpose ?? 'EMAIL_VERIFICATION', status: 'PENDING' }, data: { status: 'INVALIDATED' } });
      return tx.otpChallenge.create({ data: { userId, channel, purpose: purpose ?? 'EMAIL_VERIFICATION', otpHash, expiresAt: new Date(now.getTime() + OTP_TTL_MS) }, select: { id: true } });
    });
    return { id: result.id, code };
  }

  private async verify(userId: string, channel: 'EMAIL' | 'MOBILE', code: string, purpose?: typeof PASSWORD_RESET_PURPOSE): Promise<void> {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { userId, channel, purpose: purpose ?? 'EMAIL_VERIFICATION', status: 'PENDING' }, orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new UnauthorizedException('The code is invalid or expired.');
    }
    const expected = Buffer.from(challenge.otpHash, 'hex');
    const supplied = this.hash(userId, channel, code, purpose);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      const attempted = await this.prisma.otpChallenge.updateMany({
        where: { id: challenge.id, status: 'PENDING', attempts: { lt: MAX_VERIFY_ATTEMPTS } }, data: { attempts: { increment: 1 } },
      });
      if (attempted.count !== 1) throw new UnauthorizedException('The code is invalid or expired.');
      throw new UnauthorizedException('The code is invalid or expired.');
    }
    const consumed = await this.prisma.otpChallenge.updateMany({
      where: { id: challenge.id, userId, status: 'PENDING', attempts: { lt: MAX_VERIFY_ATTEMPTS }, expiresAt: { gt: new Date() } },
      data: { status: 'CONSUMED', consumedAt: new Date() },
    });
    if (consumed.count !== 1) throw new UnauthorizedException('The code is invalid or expired.');
  }
}
