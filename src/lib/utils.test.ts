import { describe, expect, it } from 'vitest';
import { sanitizeRedirectUrl } from './utils';

describe('sanitizeRedirectUrl', () => {
	it('allows valid relative paths', () => {
		expect.assertions(4);
		expect(sanitizeRedirectUrl('/journal')).toBe('/journal');
		expect(sanitizeRedirectUrl('/settings?tab=account')).toBe('/settings?tab=account');
		expect(sanitizeRedirectUrl('/posts/123#comments')).toBe('/posts/123#comments');
		expect(sanitizeRedirectUrl('/')).toBe('/');
	});

	it('rejects external absolute URLs and falls back', () => {
		expect.assertions(3);
		expect(sanitizeRedirectUrl('https://evil.com')).toBe('/');
		expect(sanitizeRedirectUrl('http://attacker.org/phishing')).toBe('/');
		expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/');
	});

	it('rejects protocol-relative and backslash URLs', () => {
		expect.assertions(3);
		expect(sanitizeRedirectUrl('//evil.com')).toBe('/');
		expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/');
		expect(sanitizeRedirectUrl('///evil.com')).toBe('/');
	});

	it('falls back when url is null, empty, or undefined', () => {
		expect.assertions(3);
		expect(sanitizeRedirectUrl(null)).toBe('/');
		expect(sanitizeRedirectUrl(undefined)).toBe('/');
		expect(sanitizeRedirectUrl('')).toBe('/');
	});
});
