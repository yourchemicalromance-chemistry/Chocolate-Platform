import { describe, expect, it, vi } from 'vitest';
import { validate } from 'class-validator';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';
import { UpdateDiscoveryModesDto } from './dto/update-discovery-modes.dto.js';

describe('ProfileController discovery modes', () => {
  it('scopes retrieval and replacement to the authenticated request user', async () => {
    const service = {
      getDiscoveryModes: vi.fn().mockResolvedValue({ modes: ['algorithmic'] }),
      saveDiscoveryModes: vi.fn().mockResolvedValue({ modes: ['browse'] }),
    } as unknown as ProfileService;
    const controller = new ProfileController(service);
    const request = { user: { id: 'user-a' } } as never;

    await expect(controller.getDiscoveryModes(request)).resolves.toEqual({ modes: ['algorithmic'] });
    await expect(controller.saveDiscoveryModes(request, { modes: ['browse'] })).resolves.toEqual({ modes: ['browse'] });
    expect(service.getDiscoveryModes).toHaveBeenCalledWith('user-a');
    expect(service.saveDiscoveryModes).toHaveBeenCalledWith('user-a', ['browse']);
  });

  it.each([
    [['algorithmic', 'kismat'], true],
    [['unsupported'], false],
    [['browse', 'browse'], false],
    [[], false],
    [[3], false],
  ])('validates discovery mode payload %j', async (modes, valid) => {
    const dto = Object.assign(new UpdateDiscoveryModesDto(), { modes });
    expect((await validate(dto)).length === 0).toBe(valid);
  });
});
