import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PasswordRecoveryIdentifierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(254)
  identifier!: string;
}

export class VerifyPasswordResetOtpDto extends PasswordRecoveryIdentifierDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  resetToken!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/)
  newPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  confirmPassword!: string;
}
