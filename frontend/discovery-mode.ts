export type DiscoveryMode = 'algorithmic' | 'browse' | 'kismat';

export const DISCOVERY_MODE_CHOICES: Array<{ id: DiscoveryMode; title: string }> = [
  { id: 'algorithmic', title: 'Algorithmic Recommendations' },
  { id: 'browse', title: 'Self Search / Browse' },
  { id: 'kismat', title: 'KISMAT' },
];

export function selectDiscoveryMode(_current: DiscoveryMode | null, next: DiscoveryMode): DiscoveryMode {
  return next;
}

export function profilesForDiscoveryMode<T>(profiles: T[], mode: DiscoveryMode): T[] {
  return mode === 'kismat' ? profiles.slice(0, 1) : profiles;
}

export async function saveModeThenRefresh(
  mode: DiscoveryMode,
  save: (mode: DiscoveryMode) => Promise<unknown>,
  refresh: (mode: DiscoveryMode) => Promise<void>,
): Promise<void> {
  await save(mode);
  await refresh(mode);
}

export async function saveModeThenContinue(
  mode: DiscoveryMode,
  save: (mode: DiscoveryMode) => Promise<unknown>,
  continueOnboarding: (mode: DiscoveryMode) => Promise<void>,
): Promise<void> {
  await save(mode);
  await continueOnboarding(mode);
}
