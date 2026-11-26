import { describe, expect, it, vi } from 'vitest';
import { validate } from 'class-validator';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';
import { UpdateDiscoveryModesDto } from './dto/update-discovery-modes.dto.js';
import { UpdateIntentsDto } from './dto/update-intents.dto.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

describe('ProfileController onboarding ownership', () => {
  it('uses only the authenticated user for profile load, all three saves, photos, and completion', async () => {
    const service = {
      getOnboarding: vi.fn().mockResolvedValue({ displayName: 'Ava' }),
      updateBasics: vi.fn().mockResolvedValue({ displayName: 'Ava' }),
      updateStory: vi.fn().mockResolvedValue({ bio: 'Hello' }),
      updateChemistry: vi.fn().mockResolvedValue({ interests: ['Music'] }),
      addPhoto: vi.fn().mockResolvedValue({ id: 'photo-a' }),
      complete: vi.fn().mockResolvedValue({ completed: true }),
    } as unknown as ProfileService;
    const controller = new ProfileController(service);
    const request = { user: { id: 'jwt-owner' } } as never;

    await controller.getOnboarding(request);
    await controller.updateBasics(request, { displayName: 'Ava' } as never);
    await controller.updateStory(request, { bio: 'Hello' } as never);
    await controller.updateChemistry(request, { interests: ['Music'] } as never);
    await controller.addPhoto(request, { assetId: 'asset-a' });
    await controller.complete(request);

    expect(service.getOnboarding).toHaveBeenCalledWith('jwt-owner');
    expect(service.updateBasics).toHaveBeenCalledWith('jwt-owner', { displayName: 'Ava' });
    expect(service.updateStory).toHaveBeenCalledWith('jwt-owner', { bio: 'Hello' });
    expect(service.updateChemistry).toHaveBeenCalledWith('jwt-owner', { interests: ['Music'] });
    expect(service.addPhoto).toHaveBeenCalledWith('jwt-owner', 'asset-a');
    expect(service.complete).toHaveBeenCalledWith('jwt-owner');
  });

  it('propagates profile-save errors for the frontend to display and retry', async () => {
    const service = {
      updateStory: vi.fn().mockRejectedValue(new Error('Profile save failed.')),
    } as unknown as ProfileService;
    const controller = new ProfileController(service);

    await expect(controller.updateStory({ user: { id: 'jwt-owner' } } as never, { bio: 'Hello' } as never))
      .rejects.toThrow('Profile save failed.');
  });
});

describe('ProfileController intents', () => {
  it('retrieves and saves selections for the authenticated user', async () => {
    const service = {
      getIntents: vi.fn().mockResolvedValue({ intents: ['serious'] }),
      saveIntents: vi.fn().mockResolvedValue({ intents: ['casual', 'exploring'] }),
    } as unknown as ProfileService;
    const controller = new ProfileController(service);
    const request = { user: { id: 'user-b' } } as never;

    await expect(controller.getIntents(request)).resolves.toEqual({ intents: ['serious'] });
    await expect(controller.saveIntents(request, { intents: ['casual', 'exploring'] })).resolves.toEqual({
      intents: ['casual', 'exploring'],
    });
    expect(service.getIntents).toHaveBeenCalledWith('user-b');
    expect(service.saveIntents).toHaveBeenCalledWith('user-b', ['casual', 'exploring']);
  });

  it('rejects invalid intent payloads before calling the service', async () => {
    const service = { saveIntents: vi.fn() } as unknown as ProfileService;
    const validationPipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

    for (const intents of [[], ['unsupported'], ['serious', 'serious']]) {
      await expect(validationPipe.transform({ intents }, { type: 'body', metatype: UpdateIntentsDto })).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(service.saveIntents).not.toHaveBeenCalled();
  });
});

describe('ProfileController discovery modes', () => {
  it('scopes retrieval and replacement to the authenticated request user', async () => {
    const service = {
      getDiscoveryModes: vi.fn().mockResolvedValue({ mode: 'algorithmic' }),
      saveDiscoveryModes: vi.fn().mockResolvedValue({ mode: 'browse' }),
    } as unknown as ProfileService;
    const controller = new ProfileController(service);
    const request = { user: { id: 'user-a' } } as never;

    await expect(controller.getDiscoveryModes(request)).resolves.toEqual({ mode: 'algorithmic' });
    await expect(controller.saveDiscoveryModes(request, { mode: 'browse' })).resolves.toEqual({ mode: 'browse' });
    expect(service.getDiscoveryModes).toHaveBeenCalledWith('user-a');
    expect(service.saveDiscoveryModes).toHaveBeenCalledWith('user-a', 'browse');
  });

  it.each([
    ['algorithmic', true],
    ['browse', true],
    ['kismat', true],
    ['nearby', false],
    ['unsupported', false],
    [['algorithmic', 'browse'], false],
  ])('validates discovery mode payload %j', async (mode, valid) => {
    const dto = Object.assign(new UpdateDiscoveryModesDto(), { mode });
    expect((await validate(dto)).length === 0).toBe(valid);
  });
});
