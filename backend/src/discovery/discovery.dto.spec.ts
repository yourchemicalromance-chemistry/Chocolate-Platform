import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';
import { DiscoveryFeedQueryDto, DiscoveryPaginationDto, LocationSearchDto, NearbyDiscoveryDto, ProfileActionDto } from './discovery.dto.js';

describe('Discovery request validation', () => {
  it('accepts only the supported nearby radius values and valid coordinates', async () => {
    const valid = Object.assign(new NearbyDiscoveryDto(), { latitude: 13.08, longitude: 80.27, radiusKm: 25 });
    expect(await validate(valid)).toHaveLength(0);
    const invalid = Object.assign(new NearbyDiscoveryDto(), { latitude: 200, longitude: 0, radiusKm: 12 });
    expect(await validate(invalid)).not.toHaveLength(0);
  });
  it('requires a meaningful manual destination label', async () => {
    const dto = Object.assign(new LocationSearchDto(), { latitude: 13, longitude: 80, radiusKm: 50, locationLabel: 'x' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
  it('rejects actions outside the approved reaction enum', async () => {
    const dto = Object.assign(new ProfileActionDto(), { action: 'BOOST' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
  it('bounds feed, match and saved-profile pagination', async () => {
    const invalidFeed = Object.assign(new DiscoveryFeedQueryDto(), { mode: 'nearby', page: 10, pageSize: 31 });
    const invalidOther = Object.assign(new DiscoveryPaginationDto(), { page: -1, pageSize: 100 });
    expect(await validate(invalidFeed)).not.toHaveLength(0);
    expect(await validate(invalidOther)).not.toHaveLength(0);
  });
  it('requires one of the saved discovery modes for feed requests', async () => {
    for (const mode of ['algorithmic', 'browse', 'kismat']) {
      expect(await validate(Object.assign(new DiscoveryFeedQueryDto(), { mode }))).toHaveLength(0);
    }
    expect(await validate(new DiscoveryFeedQueryDto())).not.toHaveLength(0);
    expect(await validate(Object.assign(new DiscoveryFeedQueryDto(), { mode: 'nearby' }))).not.toHaveLength(0);
  });
});
import 'reflect-metadata';
