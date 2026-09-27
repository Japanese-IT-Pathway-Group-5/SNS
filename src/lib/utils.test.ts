import { describe, expect, it } from 'vitest';
import { sanitizeRedirectUrl } from './utils';

describe('sanitizeRedirectUrl', () => {
	it.each([
		['/journal', '/journal'],
		['/settings?tab=account', '/settings?tab=account'],
		['/posts/123#comments', '/posts/123#comments'],
		['/', '/'],
		['https://evil.com', '/'],
		['http://attacker.org/phishing', '/'],
		['javascript:alert(1)', '/'],
		['//evil.com', '/'],
		['/\\evil.com', '/'],
		['///evil.com', '/'],
		[null, '/'],
		[undefined, '/'],
		['', '/']
	])('sanitizes %s to %s', (input, expected) => {
		expect.assertions(1);
		expect(sanitizeRedirectUrl(input)).toBe(expected);
	});
});
