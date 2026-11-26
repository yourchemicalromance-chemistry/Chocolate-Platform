import 'reflect-metadata';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ProfileReactionType } from '../generated/prisma/client.js';
import { DISCOVERY_MODES } from '../profile/dto/update-discovery-modes.dto.js';

export class UpdatePrivacySettingsDto {
  @IsOptional() @IsBoolean() contactLockEnabled?: boolean;
  @IsOptional() @IsBoolean() neighbourhoodLockEnabled?: boolean;
  @IsOptional() @IsBoolean() areaExclusionEnabled?: boolean;
  @IsOptional() @IsBoolean() undiscoverableEnabled?: boolean;
  @IsOptional() @IsString() @MaxLength(120) excludedArea?: string | null;
  @IsOptional() @Type(() => Number) @IsLatitude() excludedLatitude?: number | null;
  @IsOptional() @Type(() => Number) @IsLongitude() excludedLongitude?: number | null;
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(10000) @IsString({ each: true }) @MaxLength(320, { each: true }) contacts?: string[];
}

export class ReplaceContactHashesDto {
  @IsArray() @ArrayUnique() @ArrayMaxSize(10000) @IsString({ each: true }) @MaxLength(320, { each: true })
  contacts!: string[];
}

export class NearbyDiscoveryDto {
  @Type(() => Number) @IsLatitude() latitude!: number;
  @Type(() => Number) @IsLongitude() longitude!: number;
  @IsOptional() @IsString() @MaxLength(120) areaLabel?: string;
  @Type(() => Number) @IsInt() @IsIn([5, 10, 25, 50, 100]) radiusKm!: number;
}

export class LocationSearchDto extends NearbyDiscoveryDto {
  @IsString() @MinLength(2) @MaxLength(120) locationLabel!: string;
}

export class ProfileActionDto {
  @IsIn([ProfileReactionType.LIKE, ProfileReactionType.SUPER_LIKE, ProfileReactionType.PASS, ProfileReactionType.VIEW])
  action!: ProfileReactionType;
}

export class DiscoveryFeedQueryDto {
  @IsIn(DISCOVERY_MODES) mode!: (typeof DISCOVERY_MODES)[number];
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) query?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(9) page = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(30) pageSize = 30;
}

export class DiscoveryPaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(9) page = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(30) pageSize = 30;
}
