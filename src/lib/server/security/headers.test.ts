import { describe, expect, it } from 'vitest';
import { addSecurityHeaders } from './headers';

describe('security headers', () => {
	it('adds the required security headers', () => {
		const response = addSecurityHeaders(new Response('ok'));

		expect(response.headers.get('Content-Security-Policy')).toBe(
			"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
		);
		expect(response.headers.get('X-Frame-Options')).toBe('DENY');
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
	});

	it('preserves the response body and status', async () => {
		const response = addSecurityHeaders(new Response('secure', { status: 201 }));

		expect(response.status).toBe(201);
		await expect(response.text()).resolves.toBe('secure');
	});

	it('preserves existing response headers', () => {
		const response = addSecurityHeaders(
			new Response('ok', {
				headers: {
					'Cache-Control': 'no-store'
				}
			})
		);

		expect(response.headers.get('Cache-Control')).toBe('no-store');
	});
});
