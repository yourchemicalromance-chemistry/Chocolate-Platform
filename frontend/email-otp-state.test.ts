import { describe, expect, it, vi } from 'vitest';
import { runEmailOtpAction } from './email-otp-state';

describe('email OTP UI action state', () => {
    it('shows loading then a successful result without an error', async () => {
        const loading: boolean[] = [];
        const errors: string[] = [];
        const result = await runEmailOtpAction(
            async () => ({ verified: true }),
            (value) => loading.push(value),
            (value) => errors.push(value),
        );
        expect(result).toEqual({ verified: true });
        expect(loading).toEqual([true, false]);
        expect(errors).toEqual(['']);
    });

    it('clears loading and exposes a useful error when the API fails', async () => {
        const loading: boolean[] = [];
        const errors: string[] = [];
        const failure = new Error('The code is invalid or expired.');
        await expect(runEmailOtpAction(
            async () => { throw failure; },
            (value) => loading.push(value),
            (value) => errors.push(value),
        )).rejects.toBe(failure);
        expect(loading).toEqual([true, false]);
        expect(errors).toEqual(['', failure.message]);
    });

    it('uses a fallback for non-Error failures', async () => {
        const setError = vi.fn();
        await expect(runEmailOtpAction(async () => { throw 'offline'; }, vi.fn(), setError)).rejects.toBe('offline');
        expect(setError).toHaveBeenLastCalledWith('Please try again.');
    });
});
