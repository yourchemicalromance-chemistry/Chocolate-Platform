import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SignupDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(trim)
  @IsString()
  @MinLength(8)
  @MaxLength(25)
  @Matches(/^[+0-9\s().-]+$/)
  mobileNumber!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/)
  password!: string;

  @Transform(trim)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth!: string;

  @IsBoolean()
  @Equals(true)
  is18PlusDeclared!: boolean;
}
