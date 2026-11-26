import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MediaService } from './media.service.js';

@Injectable()
export class MediaDeletionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaDeletionWorker.name);
  private timer?: NodeJS.Timeout;
  private iterations = 0;

  constructor(private readonly mediaService: MediaService) {}

  onModuleInit(): void {
    // Keep account-deletion cleanup dormant until its database/storage deployment is approved.
    if (process.env.MEDIA_DELETION_WORKER_ENABLED !== 'true') return;
    this.timer = setInterval(() => {
      void Promise.all([
        this.mediaService.processDueDeletionJobs(),
        ...(++this.iterations % 10 === 0 ? [this.mediaService.scanStorageUsage()] : []),
      ]).catch(() => {
        this.logger.warn('Media deletion worker iteration failed.');
      });
    }, 60_000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
