import * as SecureStore from 'expo-secure-store';
import { File, UploadType } from 'expo-file-system';
import { validateApiBaseUrl } from './api-url';
import type { DiscoveryMode } from './discovery-mode';
export type { DiscoveryMode } from './discovery-mode';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = 'chocolate.access-token';
const pendingUploadReservationReleases = new Set<string>();
export const SESSION_EXPIRED_MESSAGE = 'Your login session has expired. Please log in again to continue.';
export class AuthenticationExpiredError extends Error {
  readonly httpStatus = 401;
  constructor() { super(SESSION_EXPIRED_MESSAGE); this.name = 'AuthenticationExpiredError'; }
}
let authExpiryShown = false;
const authExpiryListeners = new Set<() => void>();
export function subscribeToAuthenticationExpiry(listener: () => void): () => void {
  authExpiryListeners.add(listener);
  return () => authExpiryListeners.delete(listener);
}
export function isAuthenticationExpiredError(error: unknown): error is AuthenticationExpiredError {
  return error instanceof AuthenticationExpiredError;
}
function reportAuthenticationExpiry(): AuthenticationExpiredError {
  if (!authExpiryShown) {
    authExpiryShown = true;
    authExpiryListeners.forEach((listener) => listener());
  }
  return new AuthenticationExpiredError();
}

export type SignupInput = {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  dateOfBirth: string;
  is18PlusDeclared: true;
};

export type AuthResponse = { accessToken: string; user: { id: string; fullName: string; email: string; emailVerified: boolean } };
export type DatingIntent = 'serious' | 'casual' | 'flirting' | 'exploring' | 'marriage';

function apiUrl(path: string): string {
  const base = validateApiBaseUrl(API_BASE_URL, process.env.EXPO_PUBLIC_ALLOW_INSECURE_LOCAL_API === 'true');
  return `${base}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}, protectedRequest = false): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (protectedRequest && response.status === 401) throw reportAuthenticationExpiry();
    if (protectedRequest && response.status === 400 && path === '/media/storage-reservations' && /verification session.*(invalid|expired)/i.test(String(payload.message ?? ''))) {
      throw new Error('Your verification session has expired. Start a new verification session and record a new video.');
    }
    const error = new Error(Array.isArray(payload.message) ? payload.message.join('\n') : payload.message || `Request failed (${response.status}).`) as Error & { httpStatus: number };
    error.httpStatus = response.status;
    throw error;
  }
  return payload as T;
}

async function persist(response: AuthResponse): Promise<AuthResponse> {
  await SecureStore.setItemAsync(TOKEN_KEY, response.accessToken);
  authExpiryShown = false;
  const pending = [...pendingUploadReservationReleases];
  await Promise.all(pending.map(async (reservationId) => {
    try {
      await authenticatedRequest<void>(`/media/storage-reservations/${encodeURIComponent(reservationId)}`, { method: 'DELETE' });
      pendingUploadReservationReleases.delete(reservationId);
    } catch { /* The bounded server expiry remains the fallback for offline reauthentication. */ }
  }));
  return response;
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  return persist(await request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(input) }));
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  return persist(await request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }));
}

export type PasswordRecoveryResponse = {
  message: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export function requestPasswordReset(identifier: string): Promise<PasswordRecoveryResponse> {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

export function verifyPasswordResetOtp(identifier: string, code: string): Promise<{ resetToken: string; expiresInSeconds: number }> {
  return request('/auth/verify-password-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, code }),
  });
}

export function resetPassword(resetToken: string, newPassword: string, confirmPassword: string): Promise<{ passwordReset: true }> {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
  });
}

export type GoogleAuthResult = AuthResponse | { requiresProfileCompletion: true; profile: { email: string; fullName: string } };

export async function googleAuth(idToken: string, profile?: Pick<SignupInput, 'mobileNumber' | 'dateOfBirth' | 'is18PlusDeclared'>): Promise<GoogleAuthResult> {
  const result = await request<GoogleAuthResult>('/auth/google', {
    method: 'POST', body: JSON.stringify({ idToken, ...profile }),
  });
  return 'accessToken' in result ? persist(result) : result;
}

export type OtpSendResult = { status: 'sent' | 'already_verified'; expiresInSeconds?: number; resendAfterSeconds: number };

export function sendEmailOtp(): Promise<OtpSendResult> {
  return authenticatedRequest('/auth/email/send-otp', { method: 'POST' });
}

export function resendEmailOtp(): Promise<OtpSendResult> {
  return authenticatedRequest('/auth/email/resend-otp', { method: 'POST' });
}

export function verifyEmailOtp(code: string): Promise<{ verified: true; emailVerified: true }> {
  return authenticatedRequest('/auth/email/verify-otp', { method: 'POST', body: JSON.stringify({ code }) });
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function getAccountStatus(): Promise<{ email: string; emailVerified: boolean }> {
  return authenticatedRequest('/auth/account');
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw reportAuthenticationExpiry();
  return request<T>(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } }, true);
}

export function getDatingIntents(): Promise<{ intents: DatingIntent[] }> {
  return authenticatedRequest('/profile/intents');
}

export function saveDatingIntents(intents: DatingIntent[]): Promise<{ intents: DatingIntent[] }> {
  return authenticatedRequest('/profile/intents', { method: 'PUT', body: JSON.stringify({ intents }) });
}

export function getDiscoveryModes(): Promise<{ mode: DiscoveryMode | null }> {
  return authenticatedRequest('/profile/discovery-modes');
}

export function saveDiscoveryModes(mode: DiscoveryMode): Promise<{ mode: DiscoveryMode }> {
  return authenticatedRequest('/profile/discovery-modes', { method: 'PUT', body: JSON.stringify({ mode }) });
}

export type DiscoveryProfile = { id: string; name: string; age: number; distanceKm: number | null; distanceBand: string | null; location: string; profession: string; interests: string; about: string; image: string; online: boolean; isSaved: boolean };
export type DiscoveryProfileDetail = DiscoveryProfile & {
  genderIdentity: string | null; interestedIn: string[]; prompt: string | null; languages: string[];
  lifestyles: string[]; values: string[]; conversationStyles: string[]; datingIntents: DatingIntent[];
  photos: Array<{ uri: string; isMain: boolean }>; verified: boolean;
};
export type DiscoveryPrivacySettings = { contactLockEnabled: boolean; neighbourhoodLockEnabled: boolean; areaExclusionEnabled: boolean; undiscoverableEnabled: boolean; excludedArea: string | null };
export const getDiscoveryFeed = (mode: DiscoveryMode, query?: string, page = 0, pageSize = 30) => authenticatedRequest<DiscoveryProfile[]>(`/discovery/feed?${new URLSearchParams({ mode, ...(query ? { query } : {}), page: String(page), pageSize: String(pageSize) }).toString()}`);
export const getDiscoveryStats = () => authenticatedRequest<{ likes: number; matches: number; messages: number | null }>('/discovery/stats');
export const getDiscoveryMatches = (page = 0, pageSize = 30) => authenticatedRequest<DiscoveryProfile[]>(`/discovery/matches?${new URLSearchParams({ page: String(page), pageSize: String(pageSize) }).toString()}`);
export const getDiscoverySaved = (page = 0, pageSize = 30) => authenticatedRequest<DiscoveryProfile[]>(`/discovery/saved?${new URLSearchParams({ page: String(page), pageSize: String(pageSize) }).toString()}`);
export const getDiscoveryPrivacy = () => authenticatedRequest<DiscoveryPrivacySettings>('/discovery/privacy');
export const updateDiscoveryPrivacy = (settings: Partial<DiscoveryPrivacySettings> & { excludedLatitude?: number; excludedLongitude?: number; contacts?: string[] }) => authenticatedRequest<DiscoveryPrivacySettings>('/discovery/privacy', { method: 'PUT', body: JSON.stringify(settings) });
export const getDiscoveryProfile = (id: string) => authenticatedRequest<DiscoveryProfileDetail>(`/discovery/profiles/${encodeURIComponent(id)}`);
export const recordProfileAction = (id: string, action: 'LIKE' | 'SUPER_LIKE' | 'PASS' | 'VIEW') => authenticatedRequest<{ action: string; mutualMatch: boolean }>(`/discovery/profiles/${encodeURIComponent(id)}/actions`, { method: 'POST', body: JSON.stringify({ action }) });
export const saveDiscoveryProfile = (id: string) => authenticatedRequest<{ saved: boolean }>(`/discovery/profiles/${encodeURIComponent(id)}/saved`, { method: 'POST' });
export const removeSavedDiscoveryProfile = (id: string) => authenticatedRequest<{ saved: boolean }>(`/discovery/profiles/${encodeURIComponent(id)}/saved`, { method: 'DELETE' });
export const searchDiscoveryLocation = (input: { latitude: number; longitude: number; locationLabel: string; radiusKm: number }) => authenticatedRequest<DiscoveryProfile[]>('/discovery/location-search', { method: 'POST', body: JSON.stringify(input) });
export const discoverNearbyProfiles = (input: { latitude: number; longitude: number; areaLabel?: string; radiusKm: number }) => authenticatedRequest<DiscoveryProfile[]>('/discovery/nearby', { method: 'POST', body: JSON.stringify(input) });
export const getLocationSearchPreference = () => authenticatedRequest<{ areaLabel: string; radiusKm: number } | null>('/discovery/location-search');
export const getNearbyPreference = () => authenticatedRequest<{ areaLabel: string | null; radiusKm: number } | null>('/discovery/nearby');
export function getDiscoveryPhotoUrl(path: string): string { return apiUrl(path); }

export type MediaUploadResult = { assetId: string; mediaType: string; processingStatus: string; verificationStatus?: 'PENDING' | 'MANUAL_REVIEW' };

function logVideoUploadDebug(stage: string, details: Record<string, unknown> = {}): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  try { console.info('[video-upload-debug]', JSON.stringify({ stage, ...details })); } catch { /* diagnostics must not interrupt uploads */ }
}

function safeUploadDiagnosticText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(authorization|token|secret|password)\b\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/(?:https?|file|content):\/\/[^\s]+/gi, '[uri redacted]')
    .slice(0, 240);
}

function logVideoUploadError(stage: string, error: unknown, correlationId?: string): void {
  const value = error instanceof Error
    ? {
        name: error.name,
        httpStatus: (error as Error & { httpStatus?: number }).httpStatus,
        message: safeUploadDiagnosticText(error.message),
      }
    : { message: safeUploadDiagnosticText(String(error)) };
  try { console.warn('[video-upload-failure]', JSON.stringify({ stage, correlationId, ...value })); } catch { /* diagnostics must not interrupt uploads */ }
  logVideoUploadDebug(`${stage}:error`, { correlationId, ...value });
}

function logVideoUploadDiagnostic(reservationId: string, blob: Blob, uri: string): void {
  try {
    const uriPath = uri.split(/[?#]/, 1)[0] ?? uri;
    const extension = /\.([a-z0-9]+)$/i.exec(uriPath)?.[1]?.toLowerCase() ?? null;
    console.info('[video-upload-diagnostic]', JSON.stringify({
      correlationId: reservationId,
      blobMimeType: blob.type,
      blobSizeBytes: blob.size,
      localUriExtension: extension,
    }));
  } catch {
    // Diagnostics are best-effort and must never interfere with a media upload.
  }
}

export type SavedProfilePhoto = { id: string; assetId: string; position: number; isMain: boolean; ready: boolean; uri: string };
export type OnboardingProfile = {
  displayName: string | null; age?: number | null; genderIdentity: string | null; interestedIn: string[];
  bio: string | null; selectedPrompt: string | null; languages: string[];
  storedLanguages?: string[];
  interests: string[]; lifestyles: string[]; values: string[]; conversationStyles: string[];
  photos: SavedProfilePhoto[]; completed: boolean;
};
export async function getOnboardingProfile(): Promise<OnboardingProfile> {
  const profile = await authenticatedRequest<OnboardingProfile>('/profile');
  return { ...profile, photos: profile.photos.map(photo => ({ ...photo, uri: apiUrl(photo.uri) })) };
}
export function saveProfileBasics(input: { displayName?: string; genderIdentity?: string | null; interestedIn?: string[] }): Promise<OnboardingProfile> {
  return authenticatedRequest('/profile/basics', { method: 'PUT', body: JSON.stringify(input) });
}
export function saveProfileStory(input: { bio?: string; selectedPrompt?: string | null; languages?: string[] }): Promise<OnboardingProfile> {
  return authenticatedRequest('/profile/story', { method: 'PUT', body: JSON.stringify(input) });
}
export function saveProfileChemistry(input: { interests?: string[]; lifestyles?: string[]; values?: string[]; conversationStyles?: string[] }): Promise<OnboardingProfile> {
  return authenticatedRequest('/profile/chemistry', { method: 'PUT', body: JSON.stringify(input) });
}
export function attachProfilePhoto(assetId: string): Promise<SavedProfilePhoto> {
  return authenticatedRequest('/profile/photos', { method: 'POST', body: JSON.stringify({ assetId }) });
}
export function setMainProfilePhoto(photoId: string): Promise<SavedProfilePhoto[]> {
  return authenticatedRequest(`/profile/photos/${encodeURIComponent(photoId)}/main`, { method: 'PUT' });
}
export function removeProfilePhoto(photoId: string): Promise<SavedProfilePhoto[]> {
  return authenticatedRequest(`/profile/photos/${encodeURIComponent(photoId)}`, { method: 'DELETE' });
}
export function completeProfile(): Promise<{ completed: true }> { return authenticatedRequest('/profile/complete', { method: 'POST' }); }

export async function uploadMedia(
  uri: string,
  mediaType: 'PROFILE_PHOTO' | 'AGE_INTERVIEW_VIDEO',
  session?: { id: string; challengeToken: string },
  onProgress?: (fraction: number) => void,
): Promise<MediaUploadResult> {
  let stage = 'upload-entry';
  const isVideo = mediaType === 'AGE_INTERVIEW_VIDEO';
  let videoFile: File | null = null;
  let reservationId: string | undefined;
  const uriPath = uri.split(/[?#]/, 1)[0] ?? uri;
  const uriExtension = /\.([a-z0-9]+)$/i.exec(uriPath)?.[1]?.toLowerCase() ?? null;
  logVideoUploadDebug(stage, { mediaType, uriScheme: uri.split(':', 1)[0] || null, uriExtension, sessionProvided: Boolean(session) });
  try {
    let blob: Blob;
    if (isVideo) {
      // CameraView.recordAsync returns a local file URI. Read metadata through
      // Expo's native File API; fetch(file://) can resolve to an HTTP-like 404.
      stage = 'native-file-construction';
      logVideoUploadDebug(stage, { started: true });
      videoFile = new File(uri);
      logVideoUploadDebug(stage, { completed: true, constructorType: typeof File });

      stage = 'local-file-existence-validation';
      const exists = videoFile.exists;
      logVideoUploadDebug(stage, { exists, existsType: typeof exists });
      if (!exists) throw new Error('The recorded video is missing or too small. Please record again.');

      stage = 'local-file-size-validation';
      const localSize = videoFile.size;
      const localType = videoFile.type;
      logVideoUploadDebug(stage, { sizeBytes: localSize, mimeType: localType, sizeType: typeof localSize });
      if (!localSize || localSize < 16 * 1024) throw new Error('The recorded video is missing or too small. Please record again.');

      stage = 'blob-validation';
      blob = videoFile;
      logVideoUploadDebug(stage, { blobSizeBytes: blob.size, blobMimeType: blob.type, isBlobInstance: blob instanceof Blob });
      if (!blob.size || blob.size < 16 * 1024 || /^(text\/|application\/json)/i.test(blob.type)) {
        throw new Error('The recorded video file is invalid. Please record again.');
      }
    } else {
      stage = 'photo-uri-fetch';
      const localFile = await fetch(uri);
      logVideoUploadDebug(stage, { responseOk: localFile.ok, responseStatus: localFile.status });
      if (!localFile.ok) throw new Error('The selected media file could not be read.');
      stage = 'photo-blob-read';
      blob = await localFile.blob();
    }

    stage = 'reservation-token-retrieval';
    const reservationToken = await getAccessToken();
    logVideoUploadDebug(stage, { tokenPresent: Boolean(reservationToken) });
    if (!reservationToken) throw reportAuthenticationExpiry();

    stage = 'reservation-creation';
    logVideoUploadDebug(stage, { started: true, mediaType, contentLength: blob.size });
    const reservation = await request<{ reservationId: string }>('/media/storage-reservations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reservationToken}` },
      body: JSON.stringify({ mediaType, contentLength: blob.size, ...(session ? { verificationSessionId: session.id, challengeToken: session.challengeToken } : {}) }),
    }, true);
    reservationId = reservation.reservationId;
    logVideoUploadDebug(stage, { completed: true, reservationIdPresent: Boolean(reservation.reservationId) });

    stage = 'access-token-retrieval';
    const token = await getAccessToken();
    logVideoUploadDebug(stage, { tokenPresent: Boolean(token) });
    if (!token) throw reportAuthenticationExpiry();

    onProgress?.(0);
    stage = isVideo ? 'native-file-upload' : 'xhr-upload';
    logVideoUploadDebug(stage, {
      started: true,
      correlationId: reservationId,
      transport: isVideo ? 'expo-file-system-native' : 'react-native-xhr',
      fileSizeBytes: blob.size,
      contentType: 'application/octet-stream',
    });
    const uploadUrl = apiUrl(`/media/storage-reservations/${reservation.reservationId}/content`);
    let result: MediaUploadResult;
    if (isVideo) {
      const uploadResponse = await videoFile!.upload(uploadUrl, {
        httpMethod: 'POST',
        uploadType: UploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        mimeType: videoFile!.type,
        onProgress: ({ bytesSent, totalBytes }) => {
          if (totalBytes > 0) onProgress?.(Math.min(1, bytesSent / totalBytes));
        },
      });
      stage = 'native-upload-response-handling';
      let payload: Record<string, unknown> = {};
      try { payload = JSON.parse(uploadResponse.body) as Record<string, unknown>; } catch { /* backend error may have no JSON body */ }
      const serverMessage = safeUploadDiagnosticText(typeof payload.message === 'string' ? payload.message : uploadResponse.body);
      logVideoUploadDebug(stage, { httpStatus: uploadResponse.status, serverMessage });
      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        if (uploadResponse.status === 401) throw reportAuthenticationExpiry();
        if (uploadResponse.status === 400 && /verification session.*(invalid|expired)/i.test(String(payload.message ?? ''))) {
          throw new Error('Your verification session has expired. Start a new verification session and record a new video.');
        }
        const error = new Error(typeof payload.message === 'string' ? payload.message : `Media upload failed (${uploadResponse.status}).`) as Error & { httpStatus: number };
        error.httpStatus = uploadResponse.status;
        throw error;
      }
      onProgress?.(1);
      result = payload as MediaUploadResult;
    } else {
      result = await new Promise<MediaUploadResult>((resolve, reject) => {
      stage = 'xhr-construction';
      const xhr = new XMLHttpRequest();
      stage = 'xhr-open';
      xhr.open('POST', uploadUrl);
      stage = 'xhr-authorization-header';
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      stage = 'xhr-content-type-header';
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      stage = 'xhr-content-length-header';
      xhr.setRequestHeader('Content-Length', String(blob.size));
      stage = 'xhr-progress-handler';
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.min(1, event.loaded / event.total));
      };
      xhr.onerror = () => {
        stage = 'xhr-network-error';
        const error = new Error('Upload failed. Check your connection and try again.') as Error & { httpStatus: number };
        error.httpStatus = xhr.status;
        logVideoUploadDebug(stage, { httpStatus: xhr.status });
        reject(error);
      };
      xhr.onabort = () => {
        stage = 'xhr-abort';
        const error = new Error('Upload was interrupted. Please record again and retry.') as Error & { httpStatus: number };
        error.httpStatus = xhr.status;
        logVideoUploadDebug(stage, { httpStatus: xhr.status });
        reject(error);
      };
      xhr.onload = () => {
        stage = 'xhr-response-handling';
        try {
          logVideoUploadDebug(stage, { status: xhr.status, responseLength: xhr.responseText?.length ?? null });
          let payload: Record<string, unknown> = {};
          try { payload = JSON.parse(xhr.responseText) as Record<string, unknown>; } catch { /* backend error may have no JSON body */ }
          const serverMessage = safeUploadDiagnosticText(typeof payload.message === 'string' ? payload.message : xhr.responseText);
          logVideoUploadDebug(stage, { httpStatus: xhr.status, serverMessage });
          if (xhr.status < 200 || xhr.status >= 300) {
            if (xhr.status === 401) { reject(reportAuthenticationExpiry()); return; }
            if (xhr.status === 400 && /verification session.*(invalid|expired)/i.test(String(payload.message ?? ''))) {
              reject(new Error('Your verification session has expired. Start a new verification session and record a new video.')); return;
            }
            logVideoUploadDebug(stage, { accepted: false, status: xhr.status });
            const error = new Error(typeof payload.message === 'string' ? payload.message : `Media upload failed (${xhr.status}).`) as Error & { httpStatus: number };
            error.httpStatus = xhr.status;
            reject(error);
            return;
          }
          onProgress?.(1);
          logVideoUploadDebug(stage, { accepted: true, assetIdPresent: Boolean(payload.assetId) });
          resolve(payload as MediaUploadResult);
        } catch (error) {
          logVideoUploadError(stage, error, reservationId);
          reject(error);
        }
      };
      stage = 'xhr-send';
      logVideoUploadDebug(stage, { started: true, blobSizeBytes: blob.size, blobMimeType: blob.type });
      try {
        xhr.send(blob);
        logVideoUploadDebug('xhr-send', { completed: true });
      } catch (error) {
        logVideoUploadError(stage, error, reservationId);
        reject(error);
      }
      });
    }
    if (isVideo) logVideoUploadDiagnostic(reservationId!, blob, uri);
    logVideoUploadDebug('upload-complete', { assetIdPresent: Boolean(result.assetId), processingStatus: result.processingStatus });
    return result;
  } catch (error) {
    if (reservationId) {
      if (isAuthenticationExpiredError(error)) pendingUploadReservationReleases.add(reservationId);
      else {
        try { await authenticatedRequest<void>(`/media/storage-reservations/${encodeURIComponent(reservationId)}`, { method: 'DELETE' }); }
        catch (cancelError) {
          if (isAuthenticationExpiredError(cancelError)) pendingUploadReservationReleases.add(reservationId);
          /* The upload handler or 180-second expiry will reconcile it. */
        }
      }
    }
    logVideoUploadError(stage, error, reservationId);
    throw error;
  }
}

export type VerificationSession = { id: string; challengeToken: string; challengeInstructions: { actions: string[]; notice: string } };

export async function createVerificationSession(): Promise<VerificationSession> {
  return authenticatedRequest('/media/verification-sessions', { method: 'POST' });
}

export type VerificationSubmission = {
  id: string;
  status: 'PENDING' | 'MANUAL_REVIEW' | 'VERIFIED' | 'FAILED';
  createdAt: string;
  reviewedAt: string | null;
  decisionReason?: string | null;
};

export function getVideoVerificationStatus(): Promise<VerificationSubmission[]> {
  return authenticatedRequest('/media/verification-status');
}

export function getVideoReviewAccess(): Promise<{ authorized: boolean }> {
  return authenticatedRequest('/media/reviews/access');
}

export type PendingVideoReview = {
  id: string;
  status: 'PENDING' | 'MANUAL_REVIEW';
  createdAt: string;
  owner: { id: string; fullName: string };
  mediaAsset: { id: string; durationSeconds: number | null; storedSizeBytes: number | null; mimeType: string };
  session: { challengeInstructions: { actions?: string[] } };
};

export function getPendingVideoReviews(): Promise<PendingVideoReview[]> {
  return authenticatedRequest('/media/reviews/pending');
}

export function decideVideoReview(id: string, status: 'VERIFIED' | 'FAILED', reason?: string): Promise<unknown> {
  return authenticatedRequest(`/media/reviews/${encodeURIComponent(id)}`, {
    method: 'PATCH', body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
  });
}

export async function getVideoAccessHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (!token) throw reportAuthenticationExpiry();
  return { Authorization: `Bearer ${token}` };
}

export function getVideoContentUrl(assetId: string): string {
  return apiUrl(`/media/${encodeURIComponent(assetId)}/content`);
}
