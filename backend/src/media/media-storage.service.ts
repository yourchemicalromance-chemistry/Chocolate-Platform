import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, lstat, mkdir, rename, rm, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { getMediaSettings } from './media-settings.js';
import type { MediaType } from '../generated/prisma/client.js';

@Injectable()
export class MediaStorageService {
  private readonly settings = getMediaSettings();

  async ensureDirectories(): Promise<void> {
    const paths = [
      resolve(this.settings.root),
      this.directory('photos'),
      this.directory('videos'),
      this.directory('quarantine'),
      this.directory('temp'),
    ];
    await Promise.all(paths.map(async (path) => {
      await mkdir(path, { recursive: true, mode: 0o750 });
      if ((await lstat(path)).isSymbolicLink()) throw new Error('Media directories cannot be symlinks.');
      const permissions = (await stat(path)).mode & 0o777;
      if ((permissions & 0o027) !== 0) throw new Error('Media directory permissions are too broad.');
    }));
  }

  quarantinePath(reservationId: string): string {
    return this.safeResolve('quarantine', `${reservationId}.source`);
  }

  temporaryPath(assetId: string, suffix: string): string {
    return this.safeResolve('temp', `${assetId}${suffix}`);
  }

  permanentPath(type: MediaType, key: string): string {
    const allowedRoots = type === 'PROFILE_PHOTO' ? ['photos', 'profile-photos'] : ['videos', 'age-interviews'];
    if (!allowedRoots.some((directory) => key.startsWith(`${directory}/`))) throw new Error('Invalid storage key.');
    return this.safeResolve(...key.split('/'));
  }

  async writeUpload(reservationId: string, input: Readable, limit: number): Promise<number> {
    await this.ensureDirectories();
    const path = this.quarantinePath(reservationId);
    let size = 0;
    const limiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        size += chunk.length;
        if (size > limit) callback(new Error('Upload exceeded its reserved size.'));
        else callback(null, chunk);
      },
    });
    try {
      await pipeline(input, limiter, createWriteStream(path, { flags: 'wx', mode: 0o600 }));
      return size;
    } catch (error) {
      await this.remove(path);
      throw error;
    }
  }

  async moveToPermanent(from: string, type: MediaType, key: string): Promise<void> {
    await mkdir(resolve(this.settings.root, type === 'PROFILE_PHOTO' ? 'photos' : 'videos'), {
      recursive: true,
      mode: 0o750,
    });
    const target = this.permanentPath(type, key);
    await mkdir(resolve(target, '..'), { recursive: true, mode: 0o750 });
    await rename(from, target);
  }

  async remove(path: string): Promise<void> {
    const root = resolve(this.settings.root) + sep;
    const candidate = resolve(path);
    if (!candidate.startsWith(root)) throw new Error('Refusing path outside media root.');
    await rm(candidate, { force: true });
  }

  async fileSize(path: string): Promise<number> {
    try {
      return (await stat(path)).size;
    } catch {
      throw new InternalServerErrorException('Processed media could not be verified.');
    }
  }

  async restrictFile(path: string): Promise<void> {
    await chmod(path, 0o640);
  }

  createReadStream(path: string): Readable {
    return createReadStream(path);
  }

  private directory(name: string): string {
    return this.safeResolve(name);
  }

  private safeResolve(...parts: string[]): string {
    const root = resolve(this.settings.root);
    const path = resolve(root, ...parts);
    if (path !== root && !path.startsWith(root + sep)) throw new Error('Invalid storage path.');
    return path;
  }
}
