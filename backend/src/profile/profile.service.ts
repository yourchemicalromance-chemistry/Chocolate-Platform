import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DatingIntent } from './dto/update-intents.dto.js';
import type { DiscoveryMode } from './dto/update-discovery-modes.dto.js';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MediaProcessingStatus, MediaType } from '../generated/prisma/client.js';
import type { UpdateBasicsDto, UpdateChemistryDto, UpdateStoryDto } from './dto/profile-onboarding.dto.js';
import { MediaService } from '../media/media.service.js';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService, private readonly media: MediaService) {}

  async getOnboarding(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, include: { owner: { select: { dateOfBirth: true } }, interestedIn: true, languages: true, interests: true, lifestyles: true, values: true, conversationStyles: true, photos: { orderBy: { position: 'asc' }, include: { asset: { select: { processingStatus: true } } } } } });
    if (!profile) return { displayName: null, age: null, genderIdentity: null, interestedIn: [], bio: null, selectedPrompt: null, languages: ['English', 'Hindi'], storedLanguages: [], interests: [], lifestyles: [], values: [], conversationStyles: [], photos: [], completed: false };
    const storedLanguages = profile.languages.map(x => x.value);
    return { displayName: profile.displayName, age: calculateAge(profile.owner.dateOfBirth), genderIdentity: profile.genderIdentity, interestedIn: profile.interestedIn.map(x => x.value), bio: profile.bio, selectedPrompt: profile.selectedPrompt, languages: storedLanguages.length ? storedLanguages : ['English', 'Hindi'], storedLanguages, interests: profile.interests.map(x => x.value), lifestyles: profile.lifestyles.map(x => x.value), values: profile.values.map(x => x.value), conversationStyles: profile.conversationStyles.map(x => x.value), photos: profile.photos.map(({ asset, ...photo }) => ({ ...photo, ready: asset.processingStatus === MediaProcessingStatus.READY, uri: `/media/${photo.assetId}/content` })), completed: Boolean(profile.completedAt) };
  }

  async updateBasics(userId: string, input: UpdateBasicsDto) {
    if (input.interestedIn && input.interestedIn.length > 1 && input.interestedIn.some(value => value === 'Everyone' || value === 'Prefer not to say')) {
      throw new BadRequestException('Everyone and Prefer not to say must be selected on their own.');
    }
    await this.prisma.profile.upsert({ where: { userId }, create: { userId, displayName: input.displayName, genderIdentity: input.genderIdentity }, update: { ...(input.displayName !== undefined ? { displayName: input.displayName } : {}), ...(input.genderIdentity !== undefined ? { genderIdentity: input.genderIdentity } : {}) } });
    if (input.interestedIn !== undefined) await this.replaceValues(userId, 'profileMeetingPreference', input.interestedIn);
    return this.getOnboarding(userId);
  }

  async updateStory(userId: string, input: UpdateStoryDto) {
    await this.prisma.profile.upsert({ where: { userId }, create: { userId, bio: input.bio, selectedPrompt: input.selectedPrompt }, update: { ...(input.bio !== undefined ? { bio: input.bio } : {}), ...(input.selectedPrompt !== undefined ? { selectedPrompt: input.selectedPrompt } : {}) } });
    if (input.languages !== undefined) await this.replaceValues(userId, 'profileLanguage', input.languages);
    return this.getOnboarding(userId);
  }

  async updateChemistry(userId: string, input: UpdateChemistryDto) {
    await this.prisma.profile.upsert({ where: { userId }, create: { userId }, update: {} });
    for (const [field, delegate] of [['interests','profileInterest'], ['lifestyles','profileLifestyle'], ['values','profileValue'], ['conversationStyles','profileConversationStyle']] as const) {
      const vals = input[field]; if (vals !== undefined) await this.replaceValues(userId, delegate, vals);
    }
    return this.getOnboarding(userId);
  }

  private async replaceValues(userId: string, delegate: 'profileMeetingPreference'|'profileLanguage'|'profileInterest'|'profileLifestyle'|'profileValue'|'profileConversationStyle', values: string[]) {
    await this.prisma.$transaction(async tx => { const db = (tx as any)[delegate]; await db.deleteMany({ where: { userId } }); if (values.length) await db.createMany({ data: values.map(value => ({ userId, value })) }); });
  }

  async addPhoto(userId: string, assetId: string) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      const asset = await tx.mediaAsset.findUnique({ where: { id: assetId } });
      if (!asset) throw new NotFoundException('Photo asset was not found.');
      if (asset.userId !== userId) throw new ForbiddenException('You cannot use this photo.');
      if (asset.type !== MediaType.PROFILE_PHOTO || asset.processingStatus !== MediaProcessingStatus.READY) throw new BadRequestException('Photo is not ready to use.');
      await tx.profile.upsert({ where: { userId }, create: { userId }, update: {} });
      const count = await tx.profilePhoto.count({ where: { userId } });
      if (count >= 5) throw new ConflictException('A maximum of five profile photos is allowed.');
      return tx.profilePhoto.create({ data: { userId, assetId, position: count, isMain: count === 0 } });
    });
  }

  async listPhotos(userId: string) { return (await this.getOnboarding(userId)).photos; }
  async setMainPhoto(userId: string, photoId: string) {
    await this.prisma.$transaction(async tx => {
      const photo = await tx.profilePhoto.findFirst({ where: { id: photoId, userId } });
      if (!photo) throw new NotFoundException('Photo was not found.');
      await tx.profilePhoto.updateMany({ where: { userId }, data: { isMain: false } });
      await tx.profilePhoto.update({ where: { id: photoId }, data: { isMain: true } });
    });
    return this.listPhotos(userId);
  }
  async deletePhoto(userId: string, photoId: string) {
    const photo = await this.prisma.profilePhoto.findFirst({ where: { id: photoId, userId } });
    if (!photo) throw new NotFoundException('Photo was not found.');
    await this.prisma.$transaction(async tx => {
      await tx.profilePhoto.delete({ where: { id: photoId } });
      const later = await tx.profilePhoto.findMany({ where: { userId, position: { gt: photo.position } }, orderBy: { position: 'asc' }, select: { id: true } });
      for (const [index, row] of later.entries()) await tx.profilePhoto.update({ where: { id: row.id }, data: { position: photo.position + index } });
      if (photo.isMain) {
        const first = await tx.profilePhoto.findFirst({ where: { userId }, orderBy: { position: 'asc' }, select: { id: true } });
        if (first) await tx.profilePhoto.update({ where: { id: first.id }, data: { isMain: true } });
      }
    });
    await this.media.removeOwnMedia(userId, photo.assetId);
    return this.listPhotos(userId);
  }

  async complete(userId: string) {
    const p = await this.prisma.profile.findUnique({ where: { userId }, include: { interestedIn: true, languages: true, interests: true, lifestyles: true, values: true, conversationStyles: true, photos: true } });
    if (!p?.displayName?.trim() || !p.interestedIn.length || !p.bio?.trim() || !p.photos.length || !p.languages.length || !p.interests.length || !p.lifestyles.length || !p.values.length || !p.conversationStyles.length) throw new BadRequestException('Complete each profile section and add at least one photo before finishing.');
    await this.prisma.profile.update({ where: { userId }, data: { completedAt: new Date() } });
    return { completed: true };
  }

  async getIntents(userId: string): Promise<{ intents: DatingIntent[] }> {
    const rows = await this.prisma.datingIntentSelection.findMany({ where: { userId }, select: { intent: true } });
    return { intents: rows.map(({ intent }) => intent as DatingIntent) };
  }

  async saveIntents(userId: string, intents: DatingIntent[]): Promise<{ intents: DatingIntent[] }> {
    await this.prisma.$transaction(async (tx) => {
      await tx.datingIntentSelection.deleteMany({ where: { userId } });
      await tx.datingIntentSelection.createMany({ data: intents.map((intent) => ({ userId, intent })) });
    });
    return { intents };
  }

  async getDiscoveryModes(userId: string): Promise<{ mode: DiscoveryMode | null }> {
    const rows = await this.prisma.discoveryModeSelection.findMany({ where: { userId }, select: { mode: true } });
    const modes = rows.map(({ mode }) => mode).filter((mode): mode is DiscoveryMode =>
      mode === 'algorithmic' || mode === 'browse' || mode === 'kismat');
    if (modes.length > 1) throw new ConflictException('Multiple discovery modes are saved. Choose one mode to replace the legacy selection.');
    return { mode: modes[0] ?? null };
  }

  async saveDiscoveryModes(userId: string, mode: DiscoveryMode): Promise<{ mode: DiscoveryMode }> {
    await this.prisma.$transaction(async (tx) => {
      await tx.discoveryModeSelection.deleteMany({ where: { userId, mode: { in: ['algorithmic', 'browse', 'kismat'] } } });
      await tx.discoveryModeSelection.create({ data: { userId, mode } });
    });
    return { mode };
  }
}

function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  if (now.getMonth() < dateOfBirth.getMonth() || (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}
