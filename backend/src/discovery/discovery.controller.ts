import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import type { AuthenticatedRequest } from '../media/authenticated-user.js';
import { JwtAuthGuard } from '../media/jwt-auth.guard.js';
import { DiscoveryRateLimitGuard } from './discovery-rate-limit.guard.js';
import { DiscoveryService } from './discovery.service.js';
import { DiscoveryFeedQueryDto, DiscoveryPaginationDto, LocationSearchDto, NearbyDiscoveryDto, ProfileActionDto, UpdatePrivacySettingsDto } from './discovery.dto.js';

@Controller('discovery')
@UseGuards(JwtAuthGuard, DiscoveryRateLimitGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class DiscoveryController {
  constructor(private readonly service: DiscoveryService) {}
  @Get('feed') feed(@Req() req: AuthenticatedRequest, @Query() query: DiscoveryFeedQueryDto) { return this.service.getFeed(req.user.id, query); }
  @Get('stats') stats(@Req() req: AuthenticatedRequest) { return this.service.getStats(req.user.id); }
  @Get('matches') matches(@Req() req: AuthenticatedRequest, @Query() query: DiscoveryPaginationDto) { return this.service.getMatches(req.user.id, query); }
  @Get('saved') saved(@Req() req: AuthenticatedRequest, @Query() query: DiscoveryPaginationDto) { return this.service.getSaved(req.user.id, query); }
  @Get('privacy') privacy(@Req() req: AuthenticatedRequest) { return this.service.getPrivacySettings(req.user.id); }
  @Put('privacy') updatePrivacy(@Req() req: AuthenticatedRequest, @Body() input: UpdatePrivacySettingsDto) { return this.service.updatePrivacySettings(req.user.id, input); }
  @Post('nearby') nearby(@Req() req: AuthenticatedRequest, @Body() input: NearbyDiscoveryDto) { return this.service.nearby(req.user.id, input); }
  @Get('nearby') nearbyPreference(@Req() req: AuthenticatedRequest) { return this.service.getNearbyPreference(req.user.id); }
  @Get('location-search') locationPreference(@Req() req: AuthenticatedRequest) { return this.service.getLocationSearchPreference(req.user.id); }
  @Post('location-search') locationSearch(@Req() req: AuthenticatedRequest, @Body() input: LocationSearchDto) { return this.service.locationSearch(req.user.id, input); }
  @Get('profiles/:targetId') profile(@Req() req: AuthenticatedRequest, @Param('targetId', new ParseUUIDPipe()) id: string) { return this.service.getProfile(req.user.id, id); }
  @Post('profiles/:targetId/actions') action(@Req() req: AuthenticatedRequest, @Param('targetId', new ParseUUIDPipe()) id: string, @Body() input: ProfileActionDto) { return this.service.action(req.user.id, id, input); }
  @Post('profiles/:targetId/saved') save(@Req() req: AuthenticatedRequest, @Param('targetId', new ParseUUIDPipe()) id: string) { return this.service.saveProfile(req.user.id, id); }
  @Delete('profiles/:targetId/saved') unsave(@Req() req: AuthenticatedRequest, @Param('targetId', new ParseUUIDPipe()) id: string) { return this.service.unsaveProfile(req.user.id, id); }
}
