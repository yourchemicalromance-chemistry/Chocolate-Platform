import { getMediaSettings, MAX_RESERVATION_LIFETIME_MS } from './media-settings.js';

describe('media reservation lifetime', () => {
  const configured = process.env.MEDIA_RESERVATION_TTL_MS;
  afterEach(() => {
    if (configured === undefined) delete process.env.MEDIA_RESERVATION_TTL_MS;
    else process.env.MEDIA_RESERVATION_TTL_MS = configured;
  });

  it('caps configured and default reservations at 180 seconds', () => {
    process.env.MEDIA_RESERVATION_TTL_MS = '3600000';
    expect(getMediaSettings().reservationTtlMs).toBe(MAX_RESERVATION_LIFETIME_MS);
    delete process.env.MEDIA_RESERVATION_TTL_MS;
    expect(getMediaSettings().reservationTtlMs).toBe(MAX_RESERVATION_LIFETIME_MS);
  });

  it('allows a shorter configured reservation lifetime', () => {
    process.env.MEDIA_RESERVATION_TTL_MS = '30000';
    expect(getMediaSettings().reservationTtlMs).toBe(30_000);
  });
});
