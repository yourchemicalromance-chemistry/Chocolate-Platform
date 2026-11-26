import { ArrayNotEmpty, ArrayUnique, IsArray, IsIn, IsString } from 'class-validator';

export const DATING_INTENTS = ['serious', 'casual', 'flirting', 'exploring', 'marriage'] as const;
export type DatingIntent = (typeof DATING_INTENTS)[number];

export class UpdateIntentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(DATING_INTENTS, { each: true })
  intents!: DatingIntent[];
}
