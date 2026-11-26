import { IsIn } from 'class-validator';

export const DISCOVERY_MODES = ['algorithmic', 'browse', 'kismat'] as const;
export type DiscoveryMode = (typeof DISCOVERY_MODES)[number];

export class UpdateDiscoveryModesDto {
  @IsIn(DISCOVERY_MODES)
  mode!: DiscoveryMode;
}
