import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { open } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { getMediaSettings } from './media-settings.js';

const execFile = promisify(execFileCallback);

export interface ProcessedMedia {
  format: string;
  mimeType: string;
  width: number;
  height: number;
  durationSeconds: number | null;
  contentSha256: string;
  integrityPassed: boolean;
}

interface ProbeResult {
  format?: { format_name?: string; duration?: string };
  streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number }>;
}

@Injectable()
export class MediaProcessorService {
  private readonly settings = getMediaSettings();
  private readonly logger = new Logger(MediaProcessorService.name);
  private readonly ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  private readonly ffprobe = process.env.FFPROBE_PATH || 'ffprobe';

  async process(
    type: 'PROFILE_PHOTO' | 'AGE_INTERVIEW_VIDEO',
    source: string,
    output: string,
    thumbnail: string,
    diagnostic?: { correlationId: string; reservationMediaType: string; receivedFileSizeBytes: number; deadlineAt?: number },
    reservationDeadlineAt?: number,
  ): Promise<ProcessedMedia> {
    const deadlineAt = reservationDeadlineAt ?? diagnostic?.deadlineAt;
    const run = (command: string, args: string[]) => this.run(command, args, deadlineAt);
    const probe = (path: string) => this.probe(path, deadlineAt);
    const decode = (path: string) => this.decode(path, deadlineAt);
    await this.requireSignature(type, source, diagnostic);
    const sourceHash = await this.sha256(source);
    const sourceProbe = await probe(source);
    const video = sourceProbe.streams?.find((stream) => stream.codec_type === 'video');
    if (!video?.width || !video.height) throw new BadRequestException('Media has no valid video/image stream.');

    if (type === 'PROFILE_PHOTO') {
      if (!['mjpeg', 'png', 'webp'].includes(video.codec_name || '')) {
        throw new BadRequestException('Only JPEG, PNG and WebP photos are supported.');
      }
      if (video.width * video.height > this.settings.maxImagePixels) {
        throw new BadRequestException('Image dimensions exceed the configured limit.');
      }
      await run(this.ffmpeg, [
        '-nostdin', '-v', 'error', '-y', '-i', source, '-map_metadata', '-1', '-frames:v', '1',
        '-vf', `scale=w='min(${this.settings.maxImageDimension},iw)':h='min(${this.settings.maxImageDimension},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        '-c:v', 'libwebp', '-quality', '84', output,
      ]);
      await run(this.ffmpeg, [
        '-nostdin', '-v', 'error', '-y', '-i', output, '-map_metadata', '-1', '-frames:v', '1',
        '-vf', `scale=w='min(${this.settings.thumbnailDimension},iw)':h='min(${this.settings.thumbnailDimension},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        '-c:v', 'libwebp', '-quality', '78', thumbnail,
      ]);
      const verified = await probe(output);
      const out = verified.streams?.find((stream) => stream.codec_type === 'video');
      if (out?.codec_name !== 'webp' || !out.width || !out.height || out.width > this.settings.maxImageDimension || out.height > this.settings.maxImageDimension) {
        throw new Error('Photo processing output failed verification.');
      }
      await decode(thumbnail);
      return {
        format: 'webp', mimeType: 'image/webp', width: out.width, height: out.height,
        durationSeconds: null, contentSha256: sourceHash, integrityPassed: true,
      };
    }

    const duration = Number(sourceProbe.format?.duration);
    const sourceFormat = sourceProbe.format?.format_name || '';
    const supportedContainer = sourceFormat.split(',').some((name) => ['mov', 'mp4', 'matroska', 'webm'].includes(name));
    if (!supportedContainer) throw new BadRequestException('Interview video container is not supported.');
    if (
      video.width * video.height > this.settings.maxVideoInputPixels ||
      Math.max(video.width, video.height) > this.settings.maxVideoInputDimension
    ) throw new BadRequestException('Interview video resolution exceeds the configured limit.');
    if (!Number.isFinite(duration) || duration <= 0 || duration > this.settings.maxVideoSeconds) {
      throw new BadRequestException('Interview video duration is invalid or exceeds the configured limit.');
    }
    const audio = sourceProbe.streams?.some((stream) => stream.codec_type === 'audio');
    if (!audio) throw new BadRequestException('Interview video must contain an audio track.');

    await run(this.ffmpeg, [
      '-nostdin', '-v', 'error', '-y', '-i', source, '-map_metadata', '-1', '-map', '0:v:0', '-map', '0:a:0',
      '-vf', "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-maxrate', '2M', '-bufsize', '4M',
      '-c:a', 'aac', '-b:a', '128k', '-ac', '1', '-ar', '48000', '-movflags', '+faststart', output,
    ]);
    const verified = await probe(output);
    const outVideo = verified.streams?.find((stream) => stream.codec_type === 'video');
    const outAudio = verified.streams?.find((stream) => stream.codec_type === 'audio');
    const outDuration = Number(verified.format?.duration);
    if (
      !verified.format?.format_name?.includes('mp4') || outVideo?.codec_name !== 'h264' ||
      outAudio?.codec_name !== 'aac' || !outVideo.width || !outVideo.height ||
      outVideo.width > 1280 || outVideo.height > 720 || !Number.isFinite(outDuration) || outDuration > this.settings.maxVideoSeconds
    ) throw new Error('Processed interview failed output verification.');

    await run(this.ffmpeg, [
      '-nostdin', '-v', 'error', '-y', '-ss', Math.min(1, outDuration / 2).toString(), '-i', output,
      '-map_metadata', '-1', '-frames:v', '1', '-vf', `scale=w='min(${this.settings.thumbnailDimension},iw)':h='min(${this.settings.thumbnailDimension},ih)':force_original_aspect_ratio=decrease`,
      '-c:v', 'libwebp', '-quality', '78', thumbnail,
    ]);
    await decode(thumbnail);
    return {
      format: 'mp4', mimeType: 'video/mp4', width: outVideo.width, height: outVideo.height,
      durationSeconds: outDuration, contentSha256: sourceHash, integrityPassed: true,
    };
  }

  private async requireSignature(
    type: 'PROFILE_PHOTO' | 'AGE_INTERVIEW_VIDEO',
    path: string,
    diagnostic?: { correlationId: string; reservationMediaType: string; receivedFileSizeBytes: number; deadlineAt?: number },
  ): Promise<void> {
    const handle = await open(path, 'r');
    try {
      const bytes = Buffer.alloc(16);
      const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
      const head = bytes.subarray(0, bytesRead);
      const image = head[0] === 0xff && head[1] === 0xd8 || head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP' || head.toString('ascii', 1, 4) === 'PNG';
      const video = head.toString('ascii', 4, 8) === 'ftyp' || head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
      if (type === 'AGE_INTERVIEW_VIDEO' && diagnostic) {
        this.logger.log(`[video-upload-diagnostic] ${JSON.stringify({
          correlationId: diagnostic.correlationId,
          reservationMediaType: diagnostic.reservationMediaType,
          receivedFileSizeBytes: diagnostic.receivedFileSizeBytes,
        })}`);
      }
      if ((type === 'PROFILE_PHOTO' && !image) || (type === 'AGE_INTERVIEW_VIDEO' && !video)) {
        throw new BadRequestException('Uploaded content does not match the required media type.');
      }
    } finally {
      await handle.close();
    }
  }

  private async probe(path: string, deadlineAt?: number): Promise<ProbeResult> {
    const { stdout } = await this.run(this.ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path], deadlineAt);
    try {
      return JSON.parse(stdout) as ProbeResult;
    } catch {
      throw new BadRequestException('Uploaded media is not readable.');
    }
  }

  private async decode(path: string, deadlineAt?: number): Promise<void> {
    await this.run(this.ffmpeg, ['-nostdin', '-v', 'error', '-i', path, '-f', 'null', '-'], deadlineAt);
  }

  private async sha256(path: string): Promise<string> {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
    return hash.digest('hex');
  }

  private async run(command: string, args: string[], deadlineAt?: number): Promise<{ stdout: string; stderr: string }> {
    try {
      const remainingMs = deadlineAt === undefined ? 120_000 : deadlineAt - Date.now();
      if (remainingMs <= 0) throw new ServiceUnavailableException('Upload reservation expired during media processing.');
      return await execFile(command, args, { timeout: Math.min(120_000, remainingMs), maxBuffer: 2 * 1024 * 1024 });
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined;
      if (code === 'ENOENT' || code === 'EACCES' || code === 'ETIMEDOUT') {
        throw new ServiceUnavailableException('Media processing is unavailable or timed out.');
      }
      throw new BadRequestException('Uploaded media failed validation or processing.');
    }
  }
}
