import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MediaModule } from '../media/media.module.js';
import { JwtAuthGuard } from '../media/jwt-auth.guard.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [PrismaModule, AuthModule, MediaModule],
  controllers: [ProfileController],
  providers: [JwtAuthGuard, ProfileService],
})
export class ProfileModule {}
