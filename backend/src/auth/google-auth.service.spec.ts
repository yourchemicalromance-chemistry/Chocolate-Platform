import { OAuth2Client } from 'google-auth-library';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let prisma: any;
  let createAuthResponse: ReturnType<typeof vi.fn>;
  let tokenVerifier: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_IDS = 'web-client,android-client';
    prisma = { user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() } };
    createAuthResponse = vi.fn().mockResolvedValue({ accessToken: 'application-jwt' });
    service = new GoogleAuthService(prisma as PrismaService, { createAuthResponse } as unknown as AuthService);
    tokenVerifier = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({ sub: 'google-subject', email: 'ada@example.com', email_verified: true, name: 'Ada Lovelace' }),
    } as never);
  });

  afterEach(() => {
    tokenVerifier.mockRestore();
    delete process.env.GOOGLE_CLIENT_IDS;
  });

  it('validates the configured audiences and creates a new Google account without a password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'user-id', email: 'ada@example.com' });
    const result = await service.authenticate({
      idToken: 'google-id-token', mobileNumber: '9876543210', dateOfBirth: '1990-12-10', is18PlusDeclared: true,
    });
    expect(tokenVerifier).toHaveBeenCalledWith({ idToken: 'google-id-token', audience: ['web-client', 'android-client'] });
    expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({
      email: 'ada@example.com', googleSubject: 'google-subject', emailVerified: true, passwordHash: null,
    });
    expect(result).toEqual({ accessToken: 'application-jwt' });
  });

  it('safely links a verified Google identity to the existing email account', async () => {
    const existing = { id: 'user-id', email: 'ada@example.com', googleSubject: null, accountStatus: 'ACTIVE' };
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    prisma.user.update.mockResolvedValue({ ...existing, googleSubject: 'google-subject', emailVerified: true });
    await expect(service.authenticate({ idToken: 'google-id-token' })).resolves.toEqual({ accessToken: 'application-jwt' });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-id' }, data: { googleSubject: 'google-subject', emailVerified: true } });
  });

  it('rejects invalid tokens and does not create users', async () => {
    tokenVerifier.mockRejectedValue(new Error('invalid signature'));
    await expect(service.authenticate({ idToken: 'bad-token' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects identities already linked to another Google subject', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'user-id', email: 'ada@example.com', googleSubject: 'other-subject', accountStatus: 'ACTIVE',
    });
    await expect(service.authenticate({ idToken: 'google-id-token' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a profile-completion response for a new account without inventing required profile fields', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.authenticate({ idToken: 'google-id-token' })).resolves.toEqual({
      requiresProfileCompletion: true, profile: { email: 'ada@example.com', fullName: 'Ada Lovelace' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
