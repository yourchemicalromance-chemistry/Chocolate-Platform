import { BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MediaProcessorService } from './media-processor.service.js';

function stubCommands(processor: MediaProcessorService, sourcePath: string, sourceProbe: object, outputProbe: object) {
  const run = vi.fn(async (command: string, args: string[], _deadlineAt?: number): Promise<{ stdout: string; stderr: string }> => {
    if (command === 'ffprobe') {
      return { stdout: JSON.stringify(args.at(-1) === sourcePath ? sourceProbe : outputProbe), stderr: '' };
    }
    return { stdout: '', stderr: '' };
  });
  Object.defineProperty(processor, 'run', { configurable: true, writable: true, value: run });
  return run;
}

describe('MediaProcessorService input validation', () => {
  it('rejects image content whose file signature does not match an image', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'chocolate-media-test-'));
    const input = join(directory, 'upload.bin');
    await writeFile(input, Buffer.from('not an image'));
    try {
      await expect(new MediaProcessorService().process(
        'PROFILE_PHOTO', input, join(directory, 'output.webp'), join(directory, 'thumb.webp'),
      )).rejects.toBeInstanceOf(BadRequestException);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('rejects video content whose file signature is not supported video media', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'chocolate-media-test-'));
    const input = join(directory, 'upload.bin');
    await writeFile(input, Buffer.from('not a video'));
    const diagnosticLog = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    try {
      await expect(new MediaProcessorService().process(
        'AGE_INTERVIEW_VIDEO', input, join(directory, 'output.mp4'), join(directory, 'thumb.webp'),
        { correlationId: 'reservation-123', reservationMediaType: 'AGE_INTERVIEW_VIDEO', receivedFileSizeBytes: 11 },
      )).rejects.toBeInstanceOf(BadRequestException);
      expect(diagnosticLog).toHaveBeenCalledWith(expect.stringContaining('[video-upload-diagnostic]'));
      expect(diagnosticLog.mock.calls[0][0]).toContain('"correlationId":"reservation-123"');
      expect(diagnosticLog.mock.calls[0][0]).toContain('"reservationMediaType":"AGE_INTERVIEW_VIDEO"');
      expect(diagnosticLog.mock.calls[0][0]).toContain('"receivedFileSizeBytes":11');
      expect(diagnosticLog.mock.calls[0][0]).not.toContain('first16BytesHex');
    } finally {
      diagnosticLog.mockRestore();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('runs the photo processing and output verification command sequence', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'chocolate-photo-test-'));
    const input = join(directory, 'source.jpg');
    const output = join(directory, 'photo.webp');
    const thumbnail = join(directory, 'thumb.webp');
    const bytes = Buffer.alloc(16);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    await writeFile(input, bytes);
    const processor = new MediaProcessorService();
    const run = stubCommands(processor, input,
      { streams: [{ codec_type: 'video', codec_name: 'mjpeg', width: 4000, height: 3000 }] },
      { streams: [{ codec_type: 'video', codec_name: 'webp', width: 1920, height: 1440 }] },
    );
    try {
      const result = await processor.process('PROFILE_PHOTO', input, output, thumbnail);
      expect(result).toMatchObject({ format: 'webp', mimeType: 'image/webp', width: 1920, height: 1440, integrityPassed: true });
      expect(run.mock.calls.some(([, args]) => args.includes('-map_metadata') && args.includes('-1'))).toBe(true);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('transcodes and validates interview output as H.264 MP4 with AAC audio', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'chocolate-video-test-'));
    const input = join(directory, 'source.mp4');
    const output = join(directory, 'interview.mp4');
    const thumbnail = join(directory, 'thumb.webp');
    const bytes = Buffer.alloc(16);
    bytes.write('ftyp', 4, 'ascii');
    await writeFile(input, bytes);
    const processor = new MediaProcessorService();
    const run = stubCommands(processor, input,
      {
        format: { format_name: 'mov,mp4', duration: '60' },
        streams: [
          { codec_type: 'video', codec_name: 'h264', width: 1920, height: 1080 },
          { codec_type: 'audio', codec_name: 'aac' },
        ],
      },
      {
        format: { format_name: 'mov,mp4', duration: '58' },
        streams: [
          { codec_type: 'video', codec_name: 'h264', width: 1280, height: 720 },
          { codec_type: 'audio', codec_name: 'aac' },
        ],
      },
    );
    try {
      const result = await processor.process('AGE_INTERVIEW_VIDEO', input, output, thumbnail);
      expect(result).toMatchObject({ format: 'mp4', mimeType: 'video/mp4', width: 1280, height: 720, durationSeconds: 58 });
      expect(run.mock.calls.some(([, args]) => args.includes('libx264'))).toBe(true);
      expect(run.mock.calls.some(([, args]) => args.includes('aac'))).toBe(true);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
