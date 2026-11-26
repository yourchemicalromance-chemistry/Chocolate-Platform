import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MediaProcessingStatus, MediaType } from '../generated/prisma/client.js';
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
        create: (args: { data: { userId: string; mode: string } }) => Promise<void>;
      };
    }) => Promise<void>) => work({
      datingIntentSelection: {
        deleteMany: async ({ where }) => { rows.set(where.userId, []); },
        createMany: async ({ data }) => {
          for (const row of data) rows.get(row.userId)!.push(row.intent);
        },
      },
      discoveryModeSelection: {
        deleteMany: async ({ where }) => { discoveryRows.set(where.userId, discoveryRows.get(where.userId)!.filter(mode => mode === 'nearby')); },
        create: async ({ data }) => { discoveryRows.get(data.userId)!.push(data.mode); },
      },
    })),
  };
  const service = new ProfileService(prisma as never, { removeOwnMedia: vi.fn() } as never);

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

  it('replaces the saved discovery mode and preserves legacy nearby rows', async () => {
    discoveryRows.set('owner-a', ['nearby', 'algorithmic']);
    discoveryRows.set('owner-b', ['browse']);
    await expect(service.saveDiscoveryModes('owner-a', 'kismat'))
      .resolves.toEqual({ mode: 'kismat' });
    await expect(service.getDiscoveryModes('owner-a')).resolves.toEqual({ mode: 'kismat' });
    expect(discoveryRows.get('owner-a')).toEqual(['nearby', 'kismat']);
    await expect(service.getDiscoveryModes('owner-b')).resolves.toEqual({ mode: 'browse' });
  });

  it('does not silently choose between legacy multiple modes', async () => {
    discoveryRows.set('owner-a', ['algorithmic', 'browse']);
    await expect(service.getDiscoveryModes('owner-a')).rejects.toMatchObject({ status: 409 });
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

function createOnboardingStore() {
  const profiles = new Map<string, Record<string, any>>();
  const collections = new Map<string, Map<string, string[]>>();
  const photos = new Map<string, Record<string, any>[]>();
  const assets = new Map<string, Record<string, any>>();
  const collectionNames = [
    'profileMeetingPreference', 'profileLanguage', 'profileInterest',
    'profileLifestyle', 'profileValue', 'profileConversationStyle',
  ];

  const valuesFor = (collection: string, userId: string) => {
    let byUser = collections.get(collection);
    if (!byUser) { byUser = new Map(); collections.set(collection, byUser); }
    if (!byUser.has(userId)) byUser.set(userId, []);
    return byUser.get(userId)!;
  };
  const upsertProfile = vi.fn(async ({ where, create, update }: any) => {
    const base = profiles.get(where.userId) ?? {
      userId: where.userId, displayName: null, genderIdentity: null,
      bio: null, selectedPrompt: null, completedAt: null,
    };
    const definedData = Object.fromEntries(Object.entries({ ...create, ...update }).filter(([, value]) => value !== undefined));
    const next = { ...base, ...definedData };
    profiles.set(where.userId, next);
    return next;
  });
  const profileFindUnique = vi.fn(async ({ where }: any) => {
    const profile = profiles.get(where.userId);
    if (!profile) return null;
    const list = (collection: string) => valuesFor(collection, where.userId).map(value => ({ value }));
    return {
      ...profile,
      owner: { dateOfBirth: new Date('1990-01-01T00:00:00.000Z') },
      interestedIn: list('profileMeetingPreference'),
      languages: list('profileLanguage'),
      interests: list('profileInterest'),
      lifestyles: list('profileLifestyle'),
      values: list('profileValue'),
      conversationStyles: list('profileConversationStyle'),
      photos: (photos.get(where.userId) ?? []).map(photo => ({
        ...photo,
        asset: { processingStatus: assets.get(photo.assetId)?.processingStatus },
      })),
    };
  });

  const valueCreateMany = new Map<string, ReturnType<typeof vi.fn>>();
  const delegates = Object.fromEntries(collectionNames.map(collection => {
    const createMany = vi.fn(async ({ data }: any) => {
      for (const row of data) valuesFor(collection, row.userId).push(row.value);
    });
    valueCreateMany.set(collection, createMany);
    return [collection, {
      deleteMany: vi.fn(async ({ where }: any) => { valuesFor(collection, where.userId).splice(0); }),
      createMany,
    }];
  }));

  let photoSequence = 0;
  const tx = {
    $queryRaw: vi.fn(async () => undefined),
    profile: { upsert: upsertProfile },
    mediaAsset: { findUnique: vi.fn(async ({ where }: any) => assets.get(where.id) ?? null) },
    profilePhoto: {
      count: vi.fn(async ({ where }: any) => (photos.get(where.userId) ?? []).length),
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `photo-${++photoSequence}`, ...data };
        photos.set(data.userId, [...(photos.get(data.userId) ?? []), created]);
        return created;
      }),
    },
    ...delegates,
  };
  const prisma = {
    profile: {
      findUnique: profileFindUnique,
      upsert: upsertProfile,
      update: vi.fn(async ({ where, data }: any) => {
        const next = { ...profiles.get(where.userId), ...data };
        profiles.set(where.userId, next);
        return next;
      }),
    },
    $transaction: vi.fn(async (work: (tx: any) => Promise<unknown>) => work(tx)),
  };
  const media = { removeOwnMedia: vi.fn() };
  const service = new ProfileService(prisma as never, media as never);
  return { service, prisma, profiles, collections, photos, assets, valueCreateMany };
}

describe('ProfileService three-screen profile creation', () => {
  it('saves and returns the Screen 1, Screen 2, and Screen 3 fields for restoration', async () => {
    const store = createOnboardingStore();
    const { service } = store;
    await service.updateBasics('owner-a', {
      displayName: 'Ava', genderIdentity: 'Woman', interestedIn: ['Women'],
    } as never);
    await service.updateStory('owner-a', {
      bio: 'I love quiet mornings.', selectedPrompt: 'My ideal weekend looks like...', languages: ['English', 'Tamil'],
    } as never);
    store.assets.set('asset-a', {
      userId: 'owner-a', type: MediaType.PROFILE_PHOTO,
      processingStatus: MediaProcessingStatus.READY,
    });
    await service.addPhoto('owner-a', 'asset-a');
    await service.updateChemistry('owner-a', {
      interests: ['Music', 'Travel'], lifestyles: ['Active'], values: ['Honesty'], conversationStyles: ['Playful banter'],
    } as never);

    await expect(service.getOnboarding('owner-a')).resolves.toMatchObject({
      displayName: 'Ava', genderIdentity: 'Woman', interestedIn: ['Women'],
      bio: 'I love quiet mornings.', selectedPrompt: 'My ideal weekend looks like...',
      languages: ['English', 'Tamil'], storedLanguages: ['English', 'Tamil'],
      interests: ['Music', 'Travel'], lifestyles: ['Active'], values: ['Honesty'],
      conversationStyles: ['Playful banter'], completed: false,
      photos: [{ id: 'photo-1', assetId: 'asset-a', isMain: true, ready: true, uri: '/media/asset-a/content' }],
    });
  });

  it('supports partial updates while preserving earlier fields and replacing only submitted values', async () => {
    const { service } = createOnboardingStore();
    await service.updateBasics('owner-a', { displayName: 'Ava', genderIdentity: 'Woman', interestedIn: ['Women'] } as never);
    await service.updateStory('owner-a', { bio: 'Old bio', selectedPrompt: 'My ideal weekend looks like...', languages: ['English'] } as never);
    await service.updateChemistry('owner-a', { interests: ['Music'], lifestyles: ['Active'], values: ['Honesty'], conversationStyles: ['Playful banter'] } as never);

    await service.updateBasics('owner-a', { displayName: 'Ava Rose' } as never);
    await service.updateStory('owner-a', { bio: 'Updated bio' } as never);
    await service.updateChemistry('owner-a', { interests: ['Travel'] } as never);

    await expect(service.getOnboarding('owner-a')).resolves.toMatchObject({
      displayName: 'Ava Rose', genderIdentity: 'Woman', interestedIn: ['Women'],
      bio: 'Updated bio', selectedPrompt: 'My ideal weekend looks like...', languages: ['English'],
      interests: ['Travel'], lifestyles: ['Active'], values: ['Honesty'],
      conversationStyles: ['Playful banter'],
    });
  });

  it('isolates each profile and rejects attaching another user’s photo asset', async () => {
    const store = createOnboardingStore();
    await store.service.updateBasics('owner-a', { displayName: 'Ava' } as never);
    await store.service.updateBasics('owner-b', { displayName: 'Bea' } as never);
    store.assets.set('asset-a', {
      userId: 'owner-a', type: MediaType.PROFILE_PHOTO,
      processingStatus: MediaProcessingStatus.READY,
    });

    await expect(store.service.addPhoto('owner-b', 'asset-a')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(store.service.getOnboarding('owner-a')).resolves.toMatchObject({ displayName: 'Ava', photos: [] });
    await expect(store.service.getOnboarding('owner-b')).resolves.toMatchObject({ displayName: 'Bea', photos: [] });
  });

  it('does not mark a profile complete until every required screen field has been saved', async () => {
    const store = createOnboardingStore();
    const { service } = store;
    await expect(service.complete('owner-a')).rejects.toBeInstanceOf(BadRequestException);
    await service.updateBasics('owner-a', { displayName: 'Ava', interestedIn: ['Everyone'] } as never);
    await service.updateStory('owner-a', { bio: 'A complete sentence.', languages: ['English'] } as never);
    store.assets.set('asset-a', {
      userId: 'owner-a', type: MediaType.PROFILE_PHOTO,
      processingStatus: MediaProcessingStatus.READY,
    });
    await service.addPhoto('owner-a', 'asset-a');
    await service.updateChemistry('owner-a', { interests: ['Music'], lifestyles: ['Active'], values: ['Honesty'] } as never);
    await expect(service.complete('owner-a')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getOnboarding('owner-a')).resolves.toMatchObject({ completed: false });

    await service.updateChemistry('owner-a', { conversationStyles: ['Playful banter'] } as never);
    await expect(service.getOnboarding('owner-a')).resolves.toMatchObject({ completed: false });
    await expect(service.complete('owner-a')).resolves.toEqual({ completed: true });
    await expect(service.getOnboarding('owner-a')).resolves.toMatchObject({ completed: true });
  });

  it('surfaces storage failures so the screen remains in place for retry', async () => {
    const store = createOnboardingStore();
    store.valueCreateMany.get('profileMeetingPreference')!.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(store.service.updateBasics('owner-a', {
      displayName: 'Ava', interestedIn: ['Women'],
    } as never)).rejects.toThrow('storage unavailable');
    await expect(store.service.getOnboarding('owner-a')).resolves.toMatchObject({
      displayName: 'Ava', interestedIn: [], completed: false,
    });
  });
});
