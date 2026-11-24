import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { MediaModule } from './media/media.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { DiscoveryModule } from './discovery/discovery.module.js';

@Module({
  imports: [AuthModule, MediaModule, PrismaModule, ProfileModule, DiscoveryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
