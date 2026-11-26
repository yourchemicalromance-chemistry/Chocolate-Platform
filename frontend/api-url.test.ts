import { describe, expect, it } from 'vitest';
import { validateApiBaseUrl } from './api-url';

describe('API base URL privacy validation', () => {
    it('requires HTTPS for non-local API hosts', () => {
        expect(validateApiBaseUrl('https://api.example.test/')).toBe('https://api.example.test');
        expect(() => validateApiBaseUrl('http://api.example.test')).toThrow(/must use HTTPS/);
    });

    it('allows HTTP only for explicitly enabled local development hosts', () => {
        expect(validateApiBaseUrl('http://localhost:3000', true)).toBe('http://localhost:3000');
        expect(() => validateApiBaseUrl('http://localhost:3000')).toThrow(/must use HTTPS/);
        expect(() => validateApiBaseUrl('http://192.168.1.12:3000', true)).toThrow(/must use HTTPS/);
    });

    it('rejects absent or malformed configuration', () => {
        expect(() => validateApiBaseUrl(undefined)).toThrow(/Set EXPO_PUBLIC_API_URL/);
        expect(() => validateApiBaseUrl('not a URL')).toThrow(/valid HTTPS URL/);
    });
});
