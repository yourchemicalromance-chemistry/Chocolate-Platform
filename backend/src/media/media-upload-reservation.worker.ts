import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MediaService } from './media.service.js';

@Injectable()
export class MediaUploadReservationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaUploadReservationWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly mediaService: MediaService) {}

  onModuleInit(): void {
    // Reservation reconciliation is independent of account deletion and runs on
    // every backend instance; row locks and conditional transitions make it safe.
    void this.reconcile();
    this.timer = setInterval(() => void this.reconcile(), 60_000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async reconcile(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.mediaService.cleanupStaleUploads();
    } catch {
      this.logger.warn('Upload reservation reconciliation failed; it will retry on the next interval.');
    } finally {
      this.running = false;
    }
  }
}
