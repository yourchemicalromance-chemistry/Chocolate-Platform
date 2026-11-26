import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateIntentsDto } from './update-intents.dto.js';

async function validationErrors(intents: unknown) {
  return validate(plainToInstance(UpdateIntentsDto, { intents }));
}

describe('UpdateIntentsDto', () => {
  it('accepts one, several, and all approved values', async () => {
    for (const value of [['serious'], ['serious', 'casual'], ['serious', 'casual', 'flirting', 'exploring', 'marriage']]) {
      expect(await validationErrors(value)).toHaveLength(0);
    }
  });

  it('rejects empty, non-array, invalid, and duplicate values', async () => {
    for (const value of [[], 'serious', ['not-an-intent'], ['serious', 'serious']]) {
      expect(await validationErrors(value)).not.toHaveLength(0);
    }
  });
});
