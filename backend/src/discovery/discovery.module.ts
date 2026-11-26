import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../media/jwt-auth.guard.js';
import { DiscoveryController } from './discovery.controller.js';
import { DiscoveryPrivacyService } from './discovery-privacy.service.js';
import { DiscoveryService } from './discovery.service.js';
import { DiscoveryRateLimitGuard } from './discovery-rate-limit.guard.js';
import { DiscoveryRateLimitService } from './discovery-rate-limit.service.js';

@Module({ imports: [AuthModule, PrismaModule], controllers: [DiscoveryController], providers: [JwtAuthGuard, DiscoveryRateLimitGuard, DiscoveryRateLimitService, DiscoveryService, DiscoveryPrivacyService], exports: [DiscoveryPrivacyService, DiscoveryService] })
export class DiscoveryModule {}
