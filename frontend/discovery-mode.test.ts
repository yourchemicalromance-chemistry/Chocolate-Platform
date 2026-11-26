import { describe, expect, it, vi } from 'vitest';
import {
  profilesForDiscoveryMode,
  saveModeThenContinue,
  selectDiscoveryMode,
} from './discovery-mode';

describe('discovery mode selection', () => {
  it('replaces the previous selection with one of the supported modes', () => {
    expect(selectDiscoveryMode('algorithmic', 'kismat')).toBe('kismat');
  });

  it('limits a KISMAT feed to one profile while preserving other feeds', () => {
    const profiles = ['first', 'second', 'third'];
    expect(profilesForDiscoveryMode(profiles, 'kismat')).toEqual(['first']);
    expect(profilesForDiscoveryMode(profiles, 'browse')).toEqual(profiles);
  });

  it('saves the chosen mode before advancing onboarding', async () => {
    const order: string[] = [];
    const save = vi.fn(async () => { order.push('save'); });
    const advance = vi.fn(async () => { order.push('continue'); });

    await saveModeThenContinue('browse', save, advance);

    expect(order).toEqual(['save', 'continue']);
    expect(save).toHaveBeenCalledWith('browse');
    expect(advance).toHaveBeenCalledWith('browse');
  });

  it('does not advance onboarding when saving the mode fails', async () => {
    const advance = vi.fn();

    await expect(saveModeThenContinue(
      'kismat',
      async () => { throw new Error('save failed'); },
      advance,
    )).rejects.toThrow('save failed');

    expect(advance).not.toHaveBeenCalled();
  });
});
