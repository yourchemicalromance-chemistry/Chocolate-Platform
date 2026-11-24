import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpException,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import type { AuthenticatedRequest } from './authenticated-user.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MediaRateLimitGuard } from './media-rate-limit.guard.js';
import { MediaService } from './media.service.js';
import { ReserveMediaUploadDto, VerificationDecisionDto } from './dto/media-upload.dto.js';

@Controller('media')
@UseGuards(JwtAuthGuard, MediaRateLimitGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('verification-sessions')
  createVerificationSession(@Req() request: AuthenticatedRequest) {
    return this.mediaService.createVerificationSession(request.user.id);
  }

  @Post('storage-reservations')
  reserveUpload(@Req() request: AuthenticatedRequest, @Body() input: ReserveMediaUploadDto) {
    return this.mediaService.reserveUpload(request.user.id, input);
  }

  @Post('storage-reservations/:reservationId/content')
  @HttpCode(HttpStatus.CREATED)
  receiveUpload(
    @Req() request: AuthenticatedRequest,
    @Param('reservationId', new ParseUUIDPipe()) reservationId: string,
  ) {
    const header = request.headers['content-length'];
    const length = typeof header === 'string' && /^\d+$/.test(header) ? Number(header) : undefined;
    return this.mediaService.receiveUpload(request.user.id, reservationId, length, request);
  }

  @Get('verification-status')
  verificationStatus(@Req() request: AuthenticatedRequest) {
    return this.mediaService.getVerificationStatus(request.user.id);
  }

  @Get('reviews/pending')
  pendingReviews(@Req() request: AuthenticatedRequest) {
    return this.mediaService.pendingReviews(request.user.id);
  }

  @Get('reviews/access')
  reviewAccess(@Req() request: AuthenticatedRequest) {
    return { authorized: this.mediaService.hasReviewerAccess(request.user.id) };
  }

  @Patch('reviews/:verificationId')
  decideReview(
    @Req() request: AuthenticatedRequest,
    @Param('verificationId', new ParseUUIDPipe()) verificationId: string,
    @Body() input: VerificationDecisionDto,
  ) {
    return this.mediaService.decideVerification(request.user.id, verificationId, input.status, input.reason);
  }

  @Get(':assetId/content')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async readPrivateMedia(
    @Req() request: AuthenticatedRequest,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const media = await this.mediaService.getPrivateMedia(request.user.id, assetId);
    response.setHeader('Cache-Control', 'private, no-store, no-cache, max-age=0, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    response.setHeader('Vary', 'Authorization');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Content-Disposition', 'inline');
    response.setHeader('Content-Type', media.mimeType);
    response.setHeader('Accept-Ranges', 'bytes');
    const range = request.headers.range;
    if (!range) {
      response.setHeader('Content-Length', media.size);
      return new StreamableFile(createReadStream(media.path));
    }
    const parsed = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!parsed || media.size < 1 || (!parsed[1] && !parsed[2])) {
      response.setHeader('Content-Range', `bytes */${media.size}`);
      throw new HttpException('Requested media range is invalid.', HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
    }
    const start = parsed[1] ? Number(parsed[1]) : Math.max(0, media.size - Number(parsed[2]));
    const requestedEnd = parsed[2] && parsed[1] ? Number(parsed[2]) : media.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || start < 0 || start >= media.size || requestedEnd < start) {
      response.setHeader('Content-Range', `bytes */${media.size}`);
      throw new HttpException('Requested media range is invalid.', HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
    }
    const end = Math.min(requestedEnd, media.size - 1);
    response.status(HttpStatus.PARTIAL_CONTENT);
    response.setHeader('Content-Range', `bytes ${start}-${end}/${media.size}`);
    response.setHeader('Content-Length', end - start + 1);
    return new StreamableFile(createReadStream(media.path, { start, end }));
  }

  @Get('discovery-profiles/:targetId/:assetId/content')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async readDiscoveryPhoto(@Req() request: AuthenticatedRequest, @Param('targetId', new ParseUUIDPipe()) targetId: string,
    @Param('assetId', new ParseUUIDPipe()) assetId: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const media = await this.mediaService.getDiscoveryProfilePhoto(request.user.id, targetId, assetId);
    response.setHeader('Cache-Control', 'private, no-store, no-cache, max-age=0, must-revalidate');
    response.setHeader('Pragma', 'no-cache'); response.setHeader('Expires', '0'); response.setHeader('Vary', 'Authorization');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin'); response.setHeader('Content-Disposition', 'inline');
    response.setHeader('Content-Type', media.mimeType); response.setHeader('Content-Length', media.size);
    return new StreamableFile(createReadStream(media.path));
  }

  @Delete(':assetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOwnMedia(
    @Req() request: AuthenticatedRequest,
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
  ): Promise<void> {
    await this.mediaService.removeOwnMedia(request.user.id, assetId);
  }

  @Post('account-deletion')
  requestAccountDeletion(@Req() request: AuthenticatedRequest) {
    return this.mediaService.requestAccountDeletion(request.user.id);
  }
}
