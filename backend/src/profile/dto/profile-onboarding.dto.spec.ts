import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';
import { UpdateBasicsDto, UpdateChemistryDto, UpdateStoryDto } from './profile-onboarding.dto.js';

describe('profile onboarding DTOs', () => {
  it('accepts a valid basics payload and rejects duplicate or unsupported preferences', async () => {
    expect((await validate(Object.assign(new UpdateBasicsDto(), { displayName: 'Ava', interestedIn: ['Women', 'Men'] }))).length).toBe(0);
    expect((await validate(Object.assign(new UpdateBasicsDto(), { interestedIn: ['Women', 'Women'] }))).length).toBeGreaterThan(0);
    expect((await validate(Object.assign(new UpdateBasicsDto(), { interestedIn: ['Unknown'] }))).length).toBeGreaterThan(0);
  });
  it('enforces story lengths and approved choices', async () => {
    expect((await validate(Object.assign(new UpdateStoryDto(), { bio: 'hello', languages: ['English', 'Hindi'] }))).length).toBe(0);
    expect((await validate(Object.assign(new UpdateStoryDto(), { bio: 'x'.repeat(301) }))).length).toBeGreaterThan(0);
    expect((await validate(Object.assign(new UpdateStoryDto(), { selectedPrompt: 'Unsupported prompt' }))).length).toBeGreaterThan(0);
  });
  it('rejects duplicate chemistry selections', async () => {
    expect((await validate(Object.assign(new UpdateChemistryDto(), { interests: ['Music', 'Music'] }))).length).toBeGreaterThan(0);
  });
});
