import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
import type { AuthResponse, PublicAuthUser } from './auth.types.js';
import { LoginRateLimitService } from './login-rate-limit.service.js';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly loginRateLimit: LoginRateLimitService,
  ) {}

  async signup(input: SignupDto): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim().replace(/\s+/g, ' ');
    const mobileNumber = this.normalizeMobileNumber(input.mobileNumber);
    const dateOfBirth = this.parseDateOfBirth(input.dateOfBirth);

    if (input.is18PlusDeclared !== true) {
      throw new BadRequestException('The 18+ declaration is required.');
    }
    if (!this.isAtLeast18(dateOfBirth)) {
      throw new BadRequestException('You must be at least 18 years old to register.');
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          fullName,
          email,
          mobileNumber,
          dateOfBirth,
          passwordHash,
          is18PlusDeclared: true,
          ageDeclarationAt: new Date(),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An account with this email or mobile number already exists.',
        );
      }
      throw error;
    }

    return this.createAuthResponse(user);
  }

  async login(input: LoginDto, clientIp = 'unknown'): Promise<AuthResponse> {
    const normalizedIdentifier = input.identifier.trim();
    let lookup: { email: string } | { mobileNumber: string };
    let rateLimitIdentifier: string;

    if (normalizedIdentifier.includes('@')) {
      const email = normalizedIdentifier.toLowerCase();
      lookup = { email };
      rateLimitIdentifier = `email:${email}`;
    } else {
      try {
        const phone = this.normalizeMobileNumber(normalizedIdentifier);
        lookup = {
          mobileNumber: phone,
        };
        rateLimitIdentifier = `mobile:${phone}`;
      } catch {
        throw new UnauthorizedException('Invalid credentials.');
      }
    }

    const rateState = await this.loginRateLimit.inspect(clientIp, rateLimitIdentifier);
    const user = await this.prisma.user.findFirst({ where: lookup });
    if (
      !user ||
      user.accountStatus === 'PENDING_DELETION' ||
      !user.passwordHash ||
      !(await argon2.verify(user.passwordHash, input.password))
    ) {
      if (
        rateState.ipCooldownSeconds > 0 ||
        rateState.accountCooldownSeconds > 0 ||
        rateState.combinedCooldownSeconds > 0
      ) {
        throw new HttpException('Invalid credentials.', HttpStatus.TOO_MANY_REQUESTS);
      }
      await this.loginRateLimit.recordFailure(clientIp, rateLimitIdentifier);
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Valid credentials bypass temporary cooldowns so attackers cannot lock out
    // the account owner. A successful login clears account and IP/account state.
    await this.loginRateLimit.recordSuccess(clientIp, rateLimitIdentifier);
    return this.createAuthResponse(user);
  }

  async resetPassword(input: { resetToken: string; newPassword: string; confirmPassword: string }) {
    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    if (
      input.newPassword.length < 8 ||
      input.newPassword.length > 128 ||
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/.test(input.newPassword)
    ) {
      throw new BadRequestException('Password must be at least 8 characters and include a letter, number, and symbol.');
    }
    const tokenHash = createHash('sha256').update(input.resetToken).digest('hex');
    const token = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!token) throw new UnauthorizedException('The reset session is invalid or expired.');

    const passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new UnauthorizedException('The reset session is invalid or expired.');
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } });
      await tx.passwordResetToken.updateMany({
        where: { userId: token.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    });
    return { passwordReset: true };
  }

  async getAccountStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
    if (!user) throw new UnauthorizedException('Authentication is required.');
    return user;
  }

  private normalizeMobileNumber(value: string): string {
    const phoneNumber = parsePhoneNumberFromString(value, 'IN');
    if (!phoneNumber?.isValid()) {
      throw new BadRequestException('Enter a valid mobile number.');
    }
    return phoneNumber.number;
  }

  private parseDateOfBirth(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      throw new BadRequestException('Date of birth must use YYYY-MM-DD format.');
    }

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      date.getTime() > Date.now()
    ) {
      throw new BadRequestException('Enter a valid date of birth.');
    }
    return date;
  }

  private isAtLeast18(dateOfBirth: Date): boolean {
    const today = new Date();
    let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    const monthDifference = today.getUTCMonth() - dateOfBirth.getUTCMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getUTCDate() < dateOfBirth.getUTCDate())
    ) {
      age -= 1;
    }
    return age >= 18;
  }

  async createAuthResponse(user: User): Promise<AuthResponse> {
    const tokenVersion = Number.isInteger(user.tokenVersion) ? user.tokenVersion : 0;
    const accessToken = await this.jwtService.signAsync({ sub: user.id, ver: tokenVersion });
    const publicUser: PublicAuthUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      emailVerified: user.emailVerified,
    };

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: publicUser,
    };
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
