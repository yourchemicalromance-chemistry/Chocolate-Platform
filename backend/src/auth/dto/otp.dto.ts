import { Equals, IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class GoogleAuthDto {
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  idToken!: string;

  @IsString()
  @Matches(/^[+0-9\s().-]{8,25}$/)
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsOptional()
  dateOfBirth?: string;

  @IsBoolean()
  @Equals(true)
  @IsOptional()
  is18PlusDeclared?: boolean;
}
