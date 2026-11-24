import { ArrayNotEmpty, ArrayUnique, IsArray, IsIn, IsString } from 'class-validator';

// These identifiers are the selectable values in ChocolateDiscoveryModeScreen.
export const DISCOVERY_MODES = ['algorithmic', 'browse', 'kismat', 'nearby'] as const;
export type DiscoveryMode = (typeof DISCOVERY_MODES)[number];

export class UpdateDiscoveryModesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(DISCOVERY_MODES, { each: true })
  modes!: DiscoveryMode[];
}
