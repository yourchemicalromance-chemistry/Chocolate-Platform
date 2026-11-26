import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import type { AuthenticatedRequest } from '../media/authenticated-user.js';
import { JwtAuthGuard } from '../media/jwt-auth.guard.js';
import { ProfileService } from './profile.service.js';
import { UpdateIntentsDto } from './dto/update-intents.dto.js';
import { UpdateDiscoveryModesDto } from './dto/update-discovery-modes.dto.js';
import { AddProfilePhotoDto, UpdateBasicsDto, UpdateChemistryDto, UpdateStoryDto } from './dto/profile-onboarding.dto.js';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get() getOnboarding(@Req() request: AuthenticatedRequest) { return this.profileService.getOnboarding(request.user.id); }
  @Put('basics') updateBasics(@Req() request: AuthenticatedRequest, @Body() input: UpdateBasicsDto) { return this.profileService.updateBasics(request.user.id, input); }
  @Put('story') updateStory(@Req() request: AuthenticatedRequest, @Body() input: UpdateStoryDto) { return this.profileService.updateStory(request.user.id, input); }
  @Put('chemistry') updateChemistry(@Req() request: AuthenticatedRequest, @Body() input: UpdateChemistryDto) { return this.profileService.updateChemistry(request.user.id, input); }
  @Post('photos') addPhoto(@Req() request: AuthenticatedRequest, @Body() input: AddProfilePhotoDto) { return this.profileService.addPhoto(request.user.id, input.assetId); }
  @Get('photos') listPhotos(@Req() request: AuthenticatedRequest) { return this.profileService.listPhotos(request.user.id); }
  @Put('photos/:photoId/main') setMainPhoto(@Req() request: AuthenticatedRequest, @Param('photoId', new ParseUUIDPipe()) photoId: string) { return this.profileService.setMainPhoto(request.user.id, photoId); }
  @Delete('photos/:photoId') deletePhoto(@Req() request: AuthenticatedRequest, @Param('photoId', new ParseUUIDPipe()) photoId: string) { return this.profileService.deletePhoto(request.user.id, photoId); }
  @Post('complete') complete(@Req() request: AuthenticatedRequest) { return this.profileService.complete(request.user.id); }

  @Get('intents')
  getIntents(@Req() request: AuthenticatedRequest) {
    return this.profileService.getIntents(request.user.id);
  }

  @Put('intents')
  saveIntents(@Req() request: AuthenticatedRequest, @Body() input: UpdateIntentsDto) {
    return this.profileService.saveIntents(request.user.id, input.intents);
  }

  @Get('discovery-modes')
  getDiscoveryModes(@Req() request: AuthenticatedRequest) {
    return this.profileService.getDiscoveryModes(request.user.id);
  }

  @Put('discovery-modes')
  saveDiscoveryModes(@Req() request: AuthenticatedRequest, @Body() input: UpdateDiscoveryModesDto) {
    return this.profileService.saveDiscoveryModes(request.user.id, input.mode);
  }
}
