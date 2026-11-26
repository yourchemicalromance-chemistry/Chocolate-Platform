import { MediaUploadReservationWorker } from './media-upload-reservation.worker.js';

describe('MediaUploadReservationWorker', () => {
  let previousDeletionWorkerFlag: string | undefined;

  beforeEach(() => {
    previousDeletionWorkerFlag = process.env.MEDIA_DELETION_WORKER_ENABLED;
    delete process.env.MEDIA_DELETION_WORKER_ENABLED;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (previousDeletionWorkerFlag === undefined) delete process.env.MEDIA_DELETION_WORKER_ENABLED;
    else process.env.MEDIA_DELETION_WORKER_ENABLED = previousDeletionWorkerFlag;
  });

  it('reconciles at startup and every minute without enabling deletion jobs', async () => {
    vi.useFakeTimers();
    const mediaService = { cleanupStaleUploads: vi.fn().mockResolvedValue(0) };
    const worker = new MediaUploadReservationWorker(mediaService as any);
    worker.onModuleInit();
    await Promise.resolve();
    expect(mediaService.cleanupStaleUploads).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mediaService.cleanupStaleUploads).toHaveBeenCalledTimes(2);
    worker.onModuleDestroy();
  });
});
