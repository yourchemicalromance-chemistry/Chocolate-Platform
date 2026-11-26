export type GoogleOAuthClientIds = {
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
};

export function hasGoogleClientIdForPlatform(platform: string, clientIds: GoogleOAuthClientIds): boolean {
  const clientId = platform === 'android'
    ? clientIds.androidClientId
    : platform === 'ios'
      ? clientIds.iosClientId
      : clientIds.webClientId;
  return Boolean(clientId?.trim());
}
