import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { AuthResponse } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { VerifyOtpDto, GoogleAuthDto } from './dto/otp.dto.js';
import { AuthJwtGuard } from './auth-jwt.guard.js';
import type { AuthenticatedAuthRequest } from './authenticated-request.js';
import { OtpService } from './otp.service.js';
import { GoogleAuthService } from './google-auth.service.js';
import { PasswordRecoveryIdentifierDto, ResetPasswordDto, VerifyPasswordResetOtpDto } from './dto/password-recovery.dto.js';
import type { Request } from 'express';

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Post('signup')
  signup(@Body() input: SignupDto): Promise<AuthResponse> {
    return this.authService.signup(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() input: LoginDto, @Req() request: Request): Promise<AuthResponse> {
    return this.authService.login(input, request.ip ?? request.socket.remoteAddress ?? 'unknown');
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(@Body() input: GoogleAuthDto) {
    return this.googleAuthService.authenticate(input);
  }

  @Get('account')
  @UseGuards(AuthJwtGuard)
  account(@Req() request: AuthenticatedAuthRequest) {
    return this.authService.getAccountStatus(request.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() input: PasswordRecoveryIdentifierDto) {
    return this.otpService.requestPasswordReset(input.identifier);
  }

  @Post('verify-password-reset-otp')
  @HttpCode(HttpStatus.OK)
  verifyPasswordResetOtp(@Body() input: VerifyPasswordResetOtpDto) {
    return this.otpService.verifyPasswordResetOtp(input.identifier, input.code);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.authService.resetPassword(input);
  }

  @Post('email/send-otp')
  @UseGuards(AuthJwtGuard)
  @HttpCode(HttpStatus.OK)
  sendEmailOtp(@Req() request: AuthenticatedAuthRequest) {
    return this.otpService.sendEmail(request.user.id);
  }

  @Post('email/resend-otp')
  @UseGuards(AuthJwtGuard)
  @HttpCode(HttpStatus.OK)
  resendEmailOtp(@Req() request: AuthenticatedAuthRequest) {
    return this.otpService.resendEmail(request.user.id);
  }

  @Post('email/verify-otp')
  @UseGuards(AuthJwtGuard)
  @HttpCode(HttpStatus.OK)
  verifyEmailOtp(@Req() request: AuthenticatedAuthRequest, @Body() input: VerifyOtpDto) {
    return this.otpService.verifyEmail(request.user.id, input.code);
  }

  @Post('mobile/send-otp')
  @UseGuards(AuthJwtGuard)
  @HttpCode(HttpStatus.OK)
  sendMobileOtp(@Req() request: AuthenticatedAuthRequest) {
    return this.otpService.sendMobile(request.user.id);
  }

  @Post('mobile/verify-otp')
  @UseGuards(AuthJwtGuard)
  @HttpCode(HttpStatus.OK)
  verifyMobileOtp(@Req() request: AuthenticatedAuthRequest, @Body() input: VerifyOtpDto) {
    return this.otpService.verifyMobile(request.user.id, input.code);
  }
}
