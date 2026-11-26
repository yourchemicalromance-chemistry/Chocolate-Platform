import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { getItemAsync, setItemAsync, deleteItemAsync, fileState, uploadFile } = vi.hoisted(() => ({
    getItemAsync: vi.fn(),
    setItemAsync: vi.fn(),
    deleteItemAsync: vi.fn(),
    fileState: { exists: true, size: 128 * 1024, type: 'video/mp4' as string },
    uploadFile: vi.fn(),
}));

vi.mock('expo-secure-store', () => ({ getItemAsync, setItemAsync, deleteItemAsync }));
vi.mock('expo-file-system', () => ({ File: class MockFile {
    exists = fileState.exists;
    size = fileState.size;
    type = fileState.type;
    name: string;
    constructor(public uri: string) { this.name = uri.split('/').pop() ?? 'video.mp4'; }
    upload(url: string, options: unknown) { return uploadFile(url, options); }
}, UploadType: { BINARY_CONTENT: 0 } }));

describe('auth API integration', () => {
    let api: typeof import('./auth-api');
    const fetchMock = vi.fn();

    beforeAll(async () => {
        process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
        api = await import('./auth-api');
    });

    beforeEach(() => {
        fetchMock.mockReset();
        uploadFile.mockReset();
        fileState.exists = true;
        fileState.size = 128 * 1024;
        fileState.type = 'video/mp4';
        uploadFile.mockImplementation(async (_url: string, options: any) => {
            options.onProgress({ bytesSent: 5, totalBytes: 10 });
            return { status: 201, body: JSON.stringify({ assetId: 'asset-id', mediaType: 'AGE_INTERVIEW_VIDEO', processingStatus: 'READY', verificationStatus: 'PENDING' }), headers: {} };
        });
        getItemAsync.mockResolvedValue('secure-app-jwt');
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => vi.unstubAllGlobals());

    it('sends email OTP requests to the authenticated account route', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'sent', expiresInSeconds: 600, resendAfterSeconds: 60 }) });
        await expect(api.sendEmailOtp()).resolves.toMatchObject({ status: 'sent' });
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/auth/email/send-otp', expect.objectContaining({
            method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer secure-app-jwt' }),
        }));
    });

    it('posts the entered code and returns verification success', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ verified: true, emailVerified: true }) });
        await expect(api.verifyEmailOtp('123456')).resolves.toEqual({ verified: true, emailVerified: true });
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/auth/email/verify-otp');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: '123456' });
    });

    it('surfaces backend failures for the screen error state', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({ message: 'Please wait before requesting another code.' }) });
        await expect(api.resendEmailOtp()).rejects.toThrow('Please wait before requesting another code.');
    });

    it('reports 401 only for protected API calls and deduplicates the session-expiry prompt', async () => {
        const expired = vi.fn();
        const unsubscribe = api.subscribeToAuthenticationExpiry(expired);
        fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Invalid credentials.' }) });
        await expect(api.login('ada@example.test', 'bad-password')).rejects.toThrow('Invalid credentials.');
        expect(expired).not.toHaveBeenCalled();
        fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized.' }) });
        await expect(api.getAccountStatus()).rejects.toThrow('Your login session has expired. Please log in again to continue.');
        await expect(api.getVideoVerificationStatus()).rejects.toThrow('Your login session has expired. Please log in again to continue.');
        expect(expired).toHaveBeenCalledOnce();
        unsubscribe();
    });

    it('posts Google ID tokens and stores only the returned application JWT', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ accessToken: 'application-jwt', user: { id: 'u', fullName: 'Ada', email: 'ada@example.test', emailVerified: true } }) });
        await api.googleAuth('google-id-token');
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/auth/google');
        expect(setItemAsync).toHaveBeenCalledWith('chocolate.access-token', 'application-jwt');
    });

    it('fetches the caller video status through the authenticated endpoint', async () => {
        const submissions = [{ id: 's1', status: 'PENDING', createdAt: '2026-11-17T00:00:00.000Z', reviewedAt: null, decisionReason: null }];
        fetchMock.mockResolvedValue({ ok: true, json: async () => submissions });
        await expect(api.getVideoVerificationStatus()).resolves.toEqual(submissions);
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/media/verification-status', expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer secure-app-jwt' }),
        }));
    });

    it('creates a selfie verification session through the authenticated media endpoint', async () => {
        const session = { id: 'session-id', challengeToken: 'challenge-token', challengeInstructions: { actions: ['Turn left'], notice: 'Stay centered.' }, expiresAt: '2026-11-18T00:15:00.000Z' };
        fetchMock.mockResolvedValue({ ok: true, json: async () => session });
        await expect(api.createVerificationSession()).resolves.toEqual(session);
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/media/verification-sessions', expect.objectContaining({
            method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer secure-app-jwt' }),
        }));
    });

    it('retrieves and replaces the authenticated user intentions', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ intents: ['serious', 'casual'] }) });
        await expect(api.getDatingIntents()).resolves.toEqual({ intents: ['serious', 'casual'] });
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/profile/intents');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({
            headers: expect.objectContaining({ Authorization: 'Bearer secure-app-jwt' }),
        });

        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ intents: ['marriage'] }) });
        await expect(api.saveDatingIntents(['marriage'])).resolves.toEqual({ intents: ['marriage'] });
        expect(fetchMock.mock.calls[1]).toMatchObject([
            'https://api.example.test/profile/intents',
            expect.objectContaining({ method: 'PUT', body: JSON.stringify({ intents: ['marriage'] }) }),
        ]);
    });

    it('retrieves and saves authenticated discovery modes', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ mode: 'algorithmic' }) });
        await expect(api.getDiscoveryModes()).resolves.toEqual({ mode: 'algorithmic' });
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/profile/discovery-modes');
        expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer secure-app-jwt' });
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ mode: 'browse' }) });
        await expect(api.saveDiscoveryModes('browse')).resolves.toEqual({ mode: 'browse' });
        expect(fetchMock.mock.calls[1]).toMatchObject([
            'https://api.example.test/profile/discovery-modes',
            expect.objectContaining({ method: 'PUT', body: JSON.stringify({ mode: 'browse' }) }),
        ]);
    });

    it('loads, saves, and completes the saved onboarding profile', async () => {
        const profile = { displayName: 'Ava', genderIdentity: null, interestedIn: ['Women'], bio: 'Hello', selectedPrompt: null, languages: ['English'], interests: ['Music'], lifestyles: ['Active'], values: ['Honesty'], conversationStyles: ['Playful banter'], photos: [], completed: false };
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => profile });
        await expect(api.getOnboardingProfile()).resolves.toMatchObject(profile);
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => profile });
        await expect(api.saveProfileBasics({ displayName: 'Ava', genderIdentity: null, interestedIn: ['Women'] })).resolves.toMatchObject(profile);
        expect(fetchMock.mock.calls[1]).toMatchObject(['https://api.example.test/profile/basics', expect.objectContaining({
            method: 'PUT', body: JSON.stringify({ displayName: 'Ava', genderIdentity: null, interestedIn: ['Women'] }),
            headers: expect.objectContaining({ Authorization: 'Bearer secure-app-jwt' }),
        })]);
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => profile });
        await expect(api.saveProfileStory({ bio: 'Hello', languages: ['English'] })).resolves.toMatchObject(profile);
        expect(fetchMock.mock.calls[2]).toMatchObject(['https://api.example.test/profile/story', expect.objectContaining({
            method: 'PUT', body: JSON.stringify({ bio: 'Hello', languages: ['English'] }),
        })]);
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => profile });
        await expect(api.saveProfileChemistry({ interests: ['Music'], lifestyles: ['Active'], values: ['Honesty'], conversationStyles: ['Playful banter'] })).resolves.toMatchObject(profile);
        expect(fetchMock.mock.calls[3]).toMatchObject(['https://api.example.test/profile/chemistry', expect.objectContaining({
            method: 'PUT', body: JSON.stringify({ interests: ['Music'], lifestyles: ['Active'], values: ['Honesty'], conversationStyles: ['Playful banter'] }),
        })]);
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ completed: true }) });
        await expect(api.completeProfile()).resolves.toEqual({ completed: true });
        expect(fetchMock.mock.calls[4][0]).toBe('https://api.example.test/profile/complete');
    });

    it('supports partial profile saves and surfaces validation errors without dropping them', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ displayName: 'Ava' }) });
        await expect(api.saveProfileBasics({ displayName: 'Ava' })).resolves.toEqual({ displayName: 'Ava' });
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ displayName: 'Ava' });

        fetchMock.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: 'Please add a short bio.' }) });
        await expect(api.saveProfileStory({ bio: '' })).rejects.toThrow('Please add a short bio.');
    });

    it('attaches, reorders, and removes saved profile photos', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'p1', assetId: 'a1', position: 0, isMain: true }) });
        await api.attachProfilePhoto('a1');
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/profile/photos');
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });
        await api.setMainProfilePhoto('p1');
        expect(fetchMock.mock.calls[1][0]).toBe('https://api.example.test/profile/photos/p1/main');
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });
        await api.removeProfilePhoto('p1');
        expect(fetchMock.mock.calls[2][1].method).toBe('DELETE');
    });

    it('loads pending review items and posts reviewer decisions via authenticated APIs', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ authorized: true }) });
        await expect(api.getVideoReviewAccess()).resolves.toEqual({ authorized: true });
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });
        await expect(api.getPendingVideoReviews()).resolves.toEqual([]);
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 's1', status: 'VERIFIED' }) });
        await api.decideVideoReview('s1', 'VERIFIED');
        expect(fetchMock.mock.calls[2][0]).toBe('https://api.example.test/media/reviews/s1');
        expect(fetchMock.mock.calls[2][1]).toMatchObject({
            method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer secure-app-jwt' }),
            body: JSON.stringify({ status: 'VERIFIED' }),
        });
    });

    it('reserves an authenticated private interview upload and reports transfer progress', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'reservation-id' }) });
        const progress: number[] = [];
        const diagnosticLog = vi.spyOn(console, 'info').mockImplementation(() => undefined);
        await expect(api.uploadMedia('file:///private/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'challenge-token' }, (value) => progress.push(value)))
            .resolves.toMatchObject({ assetId: 'asset-id', verificationStatus: 'PENDING' });
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/media/storage-reservations');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ mediaType: 'AGE_INTERVIEW_VIDEO', verificationSessionId: 'session-id' });
        expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer secure-app-jwt' });
        expect(uploadFile).toHaveBeenCalledWith('https://api.example.test/media/storage-reservations/reservation-id/content', expect.objectContaining({
            httpMethod: 'POST', uploadType: 0,
            headers: expect.objectContaining({ Authorization: 'Bearer secure-app-jwt', 'Content-Type': 'application/octet-stream' }),
            mimeType: 'video/mp4',
        }));
        expect(progress).toEqual([0, 0.5, 1]);
        const diagnostic = diagnosticLog.mock.calls.find(([message]) => String(message).includes('[video-upload-diagnostic]'))?.join(' ');
        expect(diagnostic).toContain('"correlationId":"reservation-id"');
        expect(diagnostic).toContain('"blobMimeType":"video/mp4"');
        expect(diagnostic).toContain('"blobSizeBytes":131072');
        expect(diagnostic).toContain('"localUriExtension":"mp4"');
        expect(diagnostic).not.toContain('first16BytesHex');
        expect(diagnostic).not.toContain('file:///private/video.mp4');
        diagnosticLog.mockRestore();
    });

    it('uploads a local video with Expo File.upload using binary content', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'rn-reservation' }) });
        await expect(api.uploadMedia('file:///private/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'challenge-token' }))
            .resolves.toMatchObject({ assetId: 'asset-id' });
        expect(uploadFile).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ uploadType: 0 }));
    });

    it('explains that an expired verification challenge needs a new session and recording', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: 'Verification session is invalid or expired.' }) });
        await expect(api.uploadMedia('file:///private/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'expired-session', challengeToken: 'challenge' }))
            .rejects.toThrow('Your verification session has expired. Start a new verification session and record a new video.');
        expect(uploadFile).not.toHaveBeenCalled();
    });

    it('releases a guard-rejected reservation immediately after the next successful login', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'auth-failed-reservation' }) });
        uploadFile.mockResolvedValueOnce({ status: 401, body: JSON.stringify({ message: 'Unauthorized.' }), headers: {} });
        await expect(api.uploadMedia('file:///private/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'challenge' }))
            .rejects.toThrow('Your login session has expired. Please log in again to continue.');
        getItemAsync.mockResolvedValue('fresh-session-token');
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'fresh-session-token', user: { id: 'u', fullName: 'Ada', email: 'ada@example.test', emailVerified: true } }) });
        fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
        await api.login('ada@example.test', 'password');
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://api.example.test/media/storage-reservations/auth-failed-reservation');
        expect(fetchMock.mock.calls.at(-1)?.[1]).toMatchObject({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer fresh-session-token' }) });
    });

    it('sends the content XHR even when video diagnostics throw', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'diagnostic-reservation' }) });
        vi.spyOn(console, 'info').mockImplementation(() => { throw new Error('diagnostic logger failed'); });

        await expect(api.uploadMedia('file:///private/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'challenge-token' }))
            .resolves.toMatchObject({ assetId: 'asset-id' });
        expect(uploadFile).toHaveBeenCalled();
    });

    it('propagates actual content upload failures', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'failed-upload-reservation' }) });
        uploadFile.mockResolvedValueOnce({ status: 400, body: JSON.stringify({ message: 'Uploaded media failed validation or processing.' }), headers: {} });

        await expect(api.uploadMedia('file:///private/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'challenge-token' }))
            .rejects.toThrow('Uploaded media failed validation or processing.');
        expect(uploadFile).toHaveBeenCalled();
    });

    it('logs native upload status and a redacted server error without logging credentials', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'failed-diagnostic-reservation' }) });
        uploadFile.mockResolvedValueOnce({ status: 413, body: JSON.stringify({ message: 'Rejected Bearer private-token-value' }), headers: {} });
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await expect(api.uploadMedia('file:///private/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'challenge-token' }))
            .rejects.toThrow('Rejected Bearer private-token-value');

        const entry = warning.mock.calls.map((call) => call.join(' ')).join('\n');
        expect(entry).toContain('"httpStatus":413');
        expect(entry).toContain('Bearer [redacted]');
        expect(entry).not.toContain('private-token-value');
    });

    it('does not upload a 404 File not found response for a local video URI', async () => {
        // This is the Android failure mode: fetch(file://...) may return a
        // 404 whose 14-byte body is "File not found". Video uploads no longer
        // fetch the URI, and the native file metadata catches the bad read.
        fileState.size = 14;
        fetchMock.mockResolvedValueOnce({ ok: false, status: 404, blob: async () => new Blob(['File not found'], { type: 'text/plain' }) });
        await expect(api.uploadMedia('file:///cache/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'token' }))
            .rejects.toThrow(/missing or too small/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an empty or unexpectedly small video before creating a reservation', async () => {
        fileState.size = 14;
        await expect(api.uploadMedia('file:///cache/video.mp4', 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'token' }))
            .rejects.toThrow(/missing or too small/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        ['Android MP4', 'file:///cache/video.mp4', 'video/mp4'],
        ['iOS MOV', 'file:///cache/video.mov', 'video/quicktime'],
    ])('uploads valid %s video bytes', async (_label, uri, mimeType) => {
        fileState.type = mimeType;
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reservationId: 'valid-video-reservation' }) });
        uploadFile.mockResolvedValueOnce({ status: 201, body: JSON.stringify({ assetId: 'valid-video', mediaType: 'AGE_INTERVIEW_VIDEO' }), headers: {} });
        await expect(api.uploadMedia(uri, 'AGE_INTERVIEW_VIDEO', { id: 'session-id', challengeToken: 'token' })).resolves.toMatchObject({ assetId: 'valid-video' });
        expect(uploadFile).toHaveBeenCalledWith(expect.stringContaining('/media/storage-reservations/valid-video-reservation/content'), expect.objectContaining({ uploadType: 0, mimeType }));
    });

    it('requests password recovery using either identifier without exposing it in a route', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ message: 'If an account matches, a recovery code will be sent to its registered email address.', expiresInSeconds: 600, resendAfterSeconds: 60 }) });
        await api.requestPasswordReset('+91 98765 43210');
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/auth/forgot-password', expect.objectContaining({
            method: 'POST', body: JSON.stringify({ identifier: '+91 98765 43210' }),
        }));
    });

    it('verifies a recovery code and submits a new password without persisting reset credentials', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ resetToken: 'opaque-reset-token', expiresInSeconds: 900 }) });
        await expect(api.verifyPasswordResetOtp('ada@example.test', '123456')).resolves.toMatchObject({ resetToken: 'opaque-reset-token' });
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/auth/verify-password-reset-otp');
        expect(setItemAsync).not.toHaveBeenCalled();

        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ passwordReset: true }) });
        await expect(api.resetPassword('opaque-reset-token', 'StrongPassword2!', 'StrongPassword2!')).resolves.toEqual({ passwordReset: true });
        expect(fetchMock.mock.calls[1][0]).toBe('https://api.example.test/auth/reset-password');
        expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ resetToken: 'opaque-reset-token', newPassword: 'StrongPassword2!', confirmPassword: 'StrongPassword2!' });
    });

    it('uses authenticated endpoints for discovery location and privacy operations', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ([{ id: 'profile-1' }]) });
        await api.discoverNearbyProfiles({ latitude: 13.08, longitude: 80.27, areaLabel: 'Chennai', radiusKm: 25 });
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/discovery/nearby');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer secure-app-jwt');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ radiusKm: 25, areaLabel: 'Chennai' });
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ undiscoverableEnabled: true }) });
        await api.updateDiscoveryPrivacy({ undiscoverableEnabled: true });
        expect(fetchMock.mock.calls[1][0]).toBe('https://api.example.test/discovery/privacy');
        expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
    });

    it('posts profile actions and manual location search through authenticated APIs', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ action: 'LIKE', mutualMatch: false }) });
        await api.recordProfileAction('profile-id', 'LIKE');
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/discovery/profiles/profile-id/actions');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'LIKE' });
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
        await api.searchDiscoveryLocation({ latitude: 13, longitude: 80, locationLabel: 'Chennai', radiusKm: 50 });
        expect(fetchMock.mock.calls[1][0]).toBe('https://api.example.test/discovery/location-search');
        expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer secure-app-jwt');
    });

    it('loads authenticated feed, stats, matches, saved profiles and profile details', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
        await api.getDiscoveryFeed('browse', 'Mira');
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://api.example.test/discovery/feed?mode=browse&query=Mira&page=0&pageSize=30');
        await api.getDiscoveryStats();
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://api.example.test/discovery/stats');
        await api.getDiscoveryMatches();
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://api.example.test/discovery/matches?page=0&pageSize=30');
        await api.getDiscoverySaved();
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://api.example.test/discovery/saved?page=0&pageSize=30');
        await api.getDiscoveryProfile('target-id');
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://api.example.test/discovery/profiles/target-id');
        await api.saveDiscoveryProfile('target-id');
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://api.example.test/discovery/profiles/target-id/saved');
        expect(fetchMock.mock.calls.at(-1)?.[1].method).toBe('POST');
        await api.removeSavedDiscoveryProfile('target-id');
        expect(fetchMock.mock.calls.at(-1)?.[1].method).toBe('DELETE');
    });

    it('restores saved location and nearby radius preferences without returning coordinates', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ areaLabel: 'Chennai, India', radiusKm: 50 }) });
        await expect(api.getLocationSearchPreference()).resolves.toMatchObject({ areaLabel: 'Chennai, India', radiusKm: 50 });
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/discovery/location-search');
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ areaLabel: 'Chennai', radiusKm: 25 }) });
        await expect(api.getNearbyPreference()).resolves.toMatchObject({ radiusKm: 25 });
        expect(fetchMock.mock.calls[1][0]).toBe('https://api.example.test/discovery/nearby');
    });
});
