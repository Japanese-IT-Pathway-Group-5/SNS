import { describe, expect, it, vi } from 'vitest';
import { handle, isPublicRoute } from './hooks.server';
import { isRedirect, type RequestEvent } from '@sveltejs/kit';

describe('Server Hooks: Route Guards & Session Hydration', () => {
	it('identifies public routes correctly', () => {
		expect.assertions(6);
		expect(isPublicRoute('/login')).toBe(true);
		expect(isPublicRoute('/api/auth/sign-in')).toBe(true);
		expect(isPublicRoute('/dev/components')).toBe(true);
		expect(isPublicRoute('/demo/playwright')).toBe(true);
		expect(isPublicRoute('/favicon.svg')).toBe(true);
		expect(isPublicRoute('/_app/something.js')).toBe(true);
	});

	it('identifies protected routes correctly', () => {
		expect.assertions(4);
		expect(isPublicRoute('/')).toBe(false);
		expect(isPublicRoute('/journal')).toBe(false);
		expect(isPublicRoute('/settings')).toBe(false);
		expect(isPublicRoute('/posts/123')).toBe(false);
	});

	const verifyRedirect = async (path: string, locals: App.Locals, expectedLocation: string) => {
		const mockEvent = {
			url: new URL(`http://localhost:5173${path}`),
			request: new Request(`http://localhost:5173${path}`),
			locals,
			platform: undefined
		} as unknown as RequestEvent;

		try {
			await handle({ event: mockEvent, resolve: vi.fn() });
		} catch (error: unknown) {
			if (isRedirect(error)) {
				expect(error.status).toBe(303);
				expect(error.location).toBe(expectedLocation);
			}
		}
	};

	it('redirects unauthenticated users from protected routes to /login', async () => {
		expect.assertions(2);
		await verifyRedirect('/journal', { user: null, session: null }, '/login?redirectTo=%2Fjournal');
	});

	it('redirects authenticated users away from /login to /', async () => {
		expect.assertions(2);
		const testUser = {
			id: 'u1',
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		await verifyRedirect('/login', { user: testUser, session: null }, '/');
	});

	it('allows public routes to resolve without authentication', async () => {
		expect.assertions(2);
		const mockEvent = {
			url: new URL('http://localhost:5173/demo/playwright'),
			request: new Request('http://localhost:5173/demo/playwright'),
			locals: { user: null, session: null },
			platform: undefined
		} as unknown as RequestEvent;
		const mockResponse = new Response('ok');
		const mockResolve = vi.fn().mockResolvedValue(mockResponse);

		const response = await handle({ event: mockEvent, resolve: mockResolve });
		expect(mockResolve).toHaveBeenCalled();
		expect(response).toBe(mockResponse);
	});
});
