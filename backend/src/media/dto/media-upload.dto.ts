import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';
import { MediaType } from '../../generated/prisma/client.js';

export class ReserveMediaUploadDto {
  @IsEnum(MediaType)
  mediaType!: MediaType;

  @IsInt()
  @Min(1)
  contentLength!: number;

  @IsOptional()
  @IsUUID()
  verificationSessionId?: string;

  @IsOptional()
  @IsString()
  challengeToken?: string;
}

export class VerificationDecisionDto {
  @IsIn(['VERIFIED', 'FAILED'])
  status!: 'VERIFIED' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
