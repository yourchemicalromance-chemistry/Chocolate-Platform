import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import type { GoogleAuthDto } from './dto/otp.dto.js';

@Injectable()
export class GoogleAuthService {
  private readonly client = new OAuth2Client();

  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  async authenticate(input: GoogleAuthDto) {
    const audiences = (process.env.GOOGLE_CLIENT_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean);
    if (!audiences.length) throw new ServiceUnavailableException('Google sign-in is not configured.');
    let claims;
    try {
      const ticket = await this.client.verifyIdToken({ idToken: input.idToken, audience: audiences });
      claims = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google sign-in could not be verified.');
    }
    if (!claims?.sub || !claims.email || claims.email_verified !== true) {
      throw new UnauthorizedException('Google sign-in could not be verified.');
    }
    const email = claims.email.trim().toLowerCase();
    const subject = claims.sub;
    const bySubject = await this.prisma.user.findUnique({ where: { googleSubject: subject } });
    if (bySubject) {
      if (bySubject.email !== email) throw new ConflictException('This Google identity is linked to a different account.');
      if (bySubject.accountStatus === 'PENDING_DELETION') throw new UnauthorizedException('This account is unavailable.');
      return this.auth.createAuthResponse(bySubject);
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.googleSubject && existing.googleSubject !== subject) throw new ConflictException('This account is linked to a different Google identity.');
      if (existing.accountStatus === 'PENDING_DELETION') throw new UnauthorizedException('This account is unavailable.');
      let linked;
      try {
        linked = await this.prisma.user.update({ where: { id: existing.id }, data: { googleSubject: subject, emailVerified: true } });
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
          throw new ConflictException('This Google identity is linked to a different account.');
        }
        throw error;
      }
      return this.auth.createAuthResponse(linked);
    }
    if (!input.mobileNumber || !input.dateOfBirth || input.is18PlusDeclared !== true) {
      return { requiresProfileCompletion: true as const, profile: { email, fullName: claims.name?.trim() || email.split('@')[0] } };
    }
    const dateOfBirth = parseDob(input.dateOfBirth);
    if (!isAdult(dateOfBirth)) throw new BadRequestException('You must be at least 18 years old to register.');
    const phone = parsePhoneNumberFromString(input.mobileNumber, 'IN');
    if (!phone?.isValid()) throw new BadRequestException('Enter a valid mobile number.');
    try {
      const user = await this.prisma.user.create({ data: {
        fullName: claims.name?.trim().replace(/\s+/g, ' ').slice(0, 100) || email.split('@')[0],
        email, mobileNumber: phone.number, dateOfBirth, passwordHash: null,
        is18PlusDeclared: true, ageDeclarationAt: new Date(), emailVerified: true, googleSubject: subject,
      } });
      return this.auth.createAuthResponse(user);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('An account with these details already exists.');
      }
      throw error;
    }
  }
}

function parseDob(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date.getTime() > Date.now()) {
    throw new BadRequestException('Enter a valid date of birth.');
  }
  return date;
}

function isAdult(date: Date): boolean {
  const today = new Date();
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  if (today.getUTCMonth() < date.getUTCMonth() || (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate())) age -= 1;
  return age >= 18;
}
