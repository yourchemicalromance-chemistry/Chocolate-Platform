import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';
import { GoogleAuthService } from './google-auth.service.js';
import { AuthJwtGuard } from './auth-jwt.guard.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthController', () => {
  let app: INestApplication;
  const authService = {
    signup: vi.fn(),
    login: vi.fn(),
    resetPassword: vi.fn(),
  };
  const otpService = {
    requestPasswordReset: vi.fn(),
    verifyPasswordResetOtp: vi.fn(),
  };

  beforeEach(async () => {
    authService.signup.mockReset();
    authService.login.mockReset();
    authService.resetPassword.mockReset();
    otpService.requestPasswordReset.mockReset();
    otpService.verifyPasswordResetOtp.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: OtpService, useValue: otpService },
        { provide: GoogleAuthService, useValue: {} },
        { provide: AuthJwtGuard, useValue: { canActivate: () => true } },
        { provide: JwtService, useValue: { verifyAsync: vi.fn() } },
        { provide: PrismaService, useValue: { user: { findUnique: vi.fn() } } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('exposes POST /auth/signup and validates its request body', async () => {
    authService.signup.mockResolvedValue({
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 'id', fullName: 'Ada', email: 'ada@example.com', mobileNumber: '+919876543210' },
    });

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        fullName: 'Ada',
        email: 'ada@example.com',
        mobileNumber: '9876543210',
        password: 'StrongPassword1!',
        dateOfBirth: '1990-12-10',
        is18PlusDeclared: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.accessToken).toBe('token');
        expect(body.user).not.toHaveProperty('passwordHash');
      });

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        fullName: 'Ada',
        email: 'ada@example.com',
        mobileNumber: '9876543210',
        password: 'short',
        dateOfBirth: '1990-12-10',
        is18PlusDeclared: false,
      })
      .expect(400);

    expect(authService.signup).toHaveBeenCalledTimes(1);
  });

  it.each(['ada@example.com', '+91 98765 43210'])(
    'exposes POST /auth/login for the identifier %s with an HTTP 200 response',
    async (identifier) => {
      authService.login.mockResolvedValue({
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: { id: 'id', fullName: 'Ada', email: 'ada@example.com', mobileNumber: '+919876543210' },
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier, password: 'StrongPassword1!' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.accessToken).toBe('token');
          expect(body.user).not.toHaveProperty('passwordHash');
        });

      expect(authService.login).toHaveBeenCalledWith(
        { identifier, password: 'StrongPassword1!' },
        expect.any(String),
      );
    },
  );

  it('exposes generic recovery, OTP verification, and password reset endpoints', async () => {
    otpService.requestPasswordReset.mockResolvedValue({ message: 'If an account matches, a recovery code will be sent to its registered email address.', expiresInSeconds: 600, resendAfterSeconds: 60 });
    otpService.verifyPasswordResetOtp.mockResolvedValue({ resetToken: 'a'.repeat(43), expiresInSeconds: 900 });
    authService.resetPassword.mockResolvedValue({ passwordReset: true });

    await request(app.getHttpServer()).post('/auth/forgot-password').send({ identifier: '+91 98765 43210' }).expect(200);
    await request(app.getHttpServer()).post('/auth/verify-password-reset-otp').send({ identifier: 'ada@example.com', code: '123456' }).expect(200);
    await request(app.getHttpServer()).post('/auth/reset-password').send({ resetToken: 'a'.repeat(43), newPassword: 'StrongPassword2!', confirmPassword: 'StrongPassword2!' }).expect(200);
    expect(otpService.requestPasswordReset).toHaveBeenCalledWith('+91 98765 43210');
    expect(otpService.verifyPasswordResetOtp).toHaveBeenCalledWith('ada@example.com', '123456');
    expect(authService.resetPassword).toHaveBeenCalledWith(expect.objectContaining({ newPassword: 'StrongPassword2!' }));
  });
});
