import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MediaController } from './media.controller.js';
import { MediaDeletionWorker } from './media-deletion.worker.js';
import { MediaUploadReservationWorker } from './media-upload-reservation.worker.js';
import { MediaProcessorService } from './media-processor.service.js';
import { MediaRateLimitGuard } from './media-rate-limit.guard.js';
import { MediaService } from './media.service.js';
import { MediaStorageService } from './media-storage.service.js';
import { BuiltInReplayAnalysisProvider, VERIFICATION_ANALYSIS_PROVIDER } from './verification-analysis.provider.js';
import { DiscoveryModule } from '../discovery/discovery.module.js';

@Module({
  imports: [AuthModule, PrismaModule, DiscoveryModule],
  controllers: [MediaController],
  providers: [
    JwtAuthGuard,
    MediaRateLimitGuard,
    MediaService,
    MediaStorageService,
    MediaProcessorService,
    MediaDeletionWorker,
    MediaUploadReservationWorker,
    { provide: VERIFICATION_ANALYSIS_PROVIDER, useClass: BuiltInReplayAnalysisProvider },
  ],
  exports: [MediaService],
})
export class MediaModule {}
