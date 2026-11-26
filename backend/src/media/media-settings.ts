export interface MediaSettings {
  root: string;
  quotaBytes: bigint;
  maxUploadBytes: number;
  maxVideoSeconds: number;
  maxVideoInputPixels: number;
  maxVideoInputDimension: number;
  maxImagePixels: number;
  maxImageDimension: number;
  thumbnailDimension: number;
  maxConcurrentJobs: number;
  reservationTtlMs: number;
  verificationSessionTtlMs: number;
}

export const MAX_RESERVATION_LIFETIME_MS = 180_000;

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) throw new Error(`${name} must be a positive integer.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

export function getMediaSettings(): MediaSettings {
  const quota = positiveInteger('MEDIA_STORAGE_MAX_BYTES', 15_000_000_000);
  if (quota > 15_000_000_000) throw new Error('MEDIA_STORAGE_MAX_BYTES cannot exceed the approved 15 GB allocation.');
  return {
    root: process.env.MEDIA_STORAGE_ROOT || '/srv/chocolate-media',
    quotaBytes: BigInt(quota),
    maxUploadBytes: positiveInteger('MEDIA_MAX_UPLOAD_BYTES', 250 * 1024 * 1024),
    maxVideoSeconds: positiveInteger('MEDIA_MAX_VIDEO_DURATION_SECONDS', 60),
    maxVideoInputPixels: positiveInteger('MEDIA_MAX_VIDEO_INPUT_PIXELS', 8_294_400),
    maxVideoInputDimension: positiveInteger('MEDIA_MAX_VIDEO_INPUT_DIMENSION', 3840),
    maxImagePixels: positiveInteger('MEDIA_MAX_IMAGE_PIXELS', 40_000_000),
    maxImageDimension: positiveInteger('MEDIA_MAX_IMAGE_DIMENSION', 2048),
    thumbnailDimension: positiveInteger('MEDIA_THUMBNAIL_DIMENSION', 320),
    maxConcurrentJobs: positiveInteger('MEDIA_MAX_CONCURRENT_JOBS', 1),
    reservationTtlMs: Math.min(positiveInteger('MEDIA_RESERVATION_TTL_MS', MAX_RESERVATION_LIFETIME_MS), MAX_RESERVATION_LIFETIME_MS),
    verificationSessionTtlMs: positiveInteger('VIDEO_VERIFICATION_SESSION_TTL_MS', 15 * 60 * 1000),
  };
}

export const PHOTO_MAX_DIMENSION = 2048;
export const PHOTO_THUMBNAIL_DIMENSION = 320;
