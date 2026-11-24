import { describe, expect, it, vi } from 'vitest';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';

describe('private media delivery', () => {
  it('streams only after an authenticated service lookup and marks the response non-cacheable', async () => {
    const getPrivateMedia = vi.fn().mockResolvedValue({ path: '/private/media.webp', mimeType: 'image/webp', size: 128 });
    const mediaService = { getPrivateMedia } as unknown as MediaService;
    const controller = new MediaController(mediaService);
    const headers = new Map<string, unknown>();
    const response = { setHeader: vi.fn((name: string, value: unknown) => headers.set(name, value)) } as never;
    const request = { user: { id: 'owner-id' }, headers: {} } as never;

    await controller.readPrivateMedia(request, 'asset-id', response);

    expect(getPrivateMedia).toHaveBeenCalledWith('owner-id', 'asset-id');
    expect(headers.get('Cache-Control')).toBe('private, no-store, no-cache, max-age=0, must-revalidate');
    expect(headers.get('Pragma')).toBe('no-cache');
    expect(headers.get('Expires')).toBe('0');
    expect(headers.get('Vary')).toBe('Authorization');
    expect(headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect(headers.get('Content-Disposition')).toBe('inline');
    expect(headers.get('Content-Type')).toBe('image/webp');
  });
});
