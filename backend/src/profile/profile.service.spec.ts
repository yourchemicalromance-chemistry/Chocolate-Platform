import { describe, expect, it, vi } from 'vitest';
import { ProfileService } from './profile.service.js';

describe('ProfileService intentions', () => {
  const rows = new Map<string, string[]>();
  const discoveryRows = new Map<string, string[]>();
  const prisma = {
    datingIntentSelection: {
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
        (rows.get(where.userId) ?? []).map((intent) => ({ intent }))),
    },
    discoveryModeSelection: {
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
        (discoveryRows.get(where.userId) ?? []).map((mode) => ({ mode }))),
    },
    $transaction: vi.fn(async (work: (tx: {
      datingIntentSelection: {
        deleteMany: (args: { where: { userId: string } }) => Promise<void>;
        createMany: (args: { data: Array<{ userId: string; intent: string }> }) => Promise<void>;
      };
      discoveryModeSelection: {
        deleteMany: (args: { where: { userId: string } }) => Promise<void>;
        createMany: (args: { data: Array<{ userId: string; mode: string }> }) => Promise<void>;
      };
    }) => Promise<void>) => work({
      datingIntentSelection: {
        deleteMany: async ({ where }) => { rows.set(where.userId, []); },
        createMany: async ({ data }) => {
          for (const row of data) rows.get(row.userId)!.push(row.intent);
        },
      },
      discoveryModeSelection: {
        deleteMany: async ({ where }) => { discoveryRows.set(where.userId, []); },
        createMany: async ({ data }) => {
          for (const row of data) discoveryRows.get(row.userId)!.push(row.mode);
        },
      },
    })),
  };
  const service = new ProfileService(prisma as never);

  it.each([
    ['one', ['serious']],
    ['multiple', ['serious', 'casual', 'exploring']],
    ['all five', ['serious', 'casual', 'flirting', 'exploring', 'marriage']],
  ])('saves and retrieves %s intentions', async (userId, intents) => {
    rows.set(userId, []);
    await expect(service.saveIntents(userId, intents as never)).resolves.toEqual({ intents });
    await expect(service.getIntents(userId)).resolves.toEqual({ intents });
  });

  it('replaces saved intentions when selections are changed', async () => {
    rows.set('owner-a', ['serious', 'casual']);
    await service.saveIntents('owner-a', ['marriage'] as never);
    await expect(service.getIntents('owner-a')).resolves.toEqual({ intents: ['marriage'] });
  });

  it('keeps each user selection isolated', async () => {
    rows.set('owner-a', ['serious']);
    rows.set('owner-b', ['casual']);
    await service.saveIntents('owner-a', ['marriage'] as never);
    await expect(service.getIntents('owner-b')).resolves.toEqual({ intents: ['casual'] });
  });

  it('saves and retrieves discovery modes for the authenticated user only', async () => {
    discoveryRows.set('owner-a', []);
    discoveryRows.set('owner-b', ['browse']);
    await expect(service.saveDiscoveryModes('owner-a', ['algorithmic', 'kismat'] as never))
      .resolves.toEqual({ modes: ['algorithmic', 'kismat'] });
    await expect(service.getDiscoveryModes('owner-a')).resolves.toEqual({ modes: ['algorithmic', 'kismat'] });
    await expect(service.getDiscoveryModes('owner-b')).resolves.toEqual({ modes: ['browse'] });
  });
});

describe('ProfileService onboarding language values', () => {
  it('keeps stored language selections separate from the onboarding display defaults', async () => {
    const profile = {
      displayName: 'Ava', genderIdentity: null, bio: null, selectedPrompt: null, completedAt: null,
      owner: { dateOfBirth: new Date('1990-01-01') }, interestedIn: [], languages: [], interests: [],
      lifestyles: [], values: [], conversationStyles: [], photos: [],
    };
    const findUnique = vi.fn().mockResolvedValue(profile);
    const service = new ProfileService({ profile: { findUnique } } as never, {} as never);

    await expect(service.getOnboarding('owner-a')).resolves.toMatchObject({
      languages: ['English', 'Hindi'],
      storedLanguages: [],
    });

    findUnique.mockResolvedValue({ ...profile, languages: [{ value: 'Tamil' }, { value: 'English' }] });
    await expect(service.getOnboarding('owner-a')).resolves.toMatchObject({
      languages: ['Tamil', 'English'],
      storedLanguages: ['Tamil', 'English'],
    });
  });
});
