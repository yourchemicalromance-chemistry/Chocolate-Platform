import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthJwtGuard } from './auth-jwt.guard.js';
import { EmailOtpDelivery, SMS_OTP_PROVIDER, UnconfiguredSmsOtpProvider } from './otp-delivery.js';
import { OtpService } from './otp.service.js';
import { GoogleAuthService } from './google-auth.service.js';
import { LoginRateLimitService } from './login-rate-limit.service.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
          throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
        }
        return {
          secret,
          signOptions: { expiresIn: 900, algorithm: 'HS256' as const },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthJwtGuard, EmailOtpDelivery, OtpService, GoogleAuthService, LoginRateLimitService,
    { provide: SMS_OTP_PROVIDER, useClass: UnconfiguredSmsOtpProvider }],
  // Media endpoints reuse the existing JWT signing configuration for verification.
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
