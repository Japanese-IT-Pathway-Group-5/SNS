import { describe, expect, it, vi } from 'vitest';
import { createAuth, getAuth } from './index';
import * as schema from '$lib/server/db/schema';
import { authClient, signInWithGoogle } from '$lib/auth-client';

describe('Better Auth D1 configuration', () => {
	const mockD1: D1Database = {
		prepare: vi.fn(),
		dump: vi.fn(),
		batch: vi.fn(),
		exec: vi.fn(),
		withSession: vi.fn()
	} as unknown as D1Database;

	it('exports expected database schema tables', () => {
		expect.assertions(4);
		expect(schema.user).toBeDefined();
		expect(schema.session).toBeDefined();
		expect(schema.account).toBeDefined();
		expect(schema.verification).toBeDefined();
	});

	it('creates Better Auth server instance with D1 adapter', () => {
		expect.assertions(3);
		const auth = createAuth(mockD1, {
			BETTER_AUTH_SECRET: 'test-secret-12345678901234567890',
			BETTER_AUTH_URL: 'http://localhost:5173'
		});

		expect(auth).toBeDefined();
		expect(typeof auth.handler).toBe('function');
		expect(auth.options.baseURL).toBe('http://localhost:5173');
	});

	it('configures Google OAuth provider when credentials are provided', () => {
		expect.assertions(3);
		const auth = createAuth(mockD1, {
			BETTER_AUTH_SECRET: 'test-secret-12345678901234567890',
			BETTER_AUTH_URL: 'http://localhost:5173',
			GOOGLE_CLIENT_ID: 'google-client-id-test',
			GOOGLE_CLIENT_SECRET: 'google-client-secret-test'
		});

		const googleConfig = auth.options.socialProviders?.google;
		expect(googleConfig).toBeDefined();
		expect(googleConfig?.clientId).toBe('google-client-id-test');
		expect(googleConfig?.clientSecret).toBe('google-client-secret-test');
	});

	it('getAuth is an alias to createAuth', () => {
		expect.assertions(2);
		expect(getAuth).toBe(createAuth);
		const auth = getAuth(mockD1);
		expect(auth).toBeDefined();
	});

	it('exports frontend auth client with expected methods and Google sign-in helper', () => {
		expect.assertions(5);
		expect(typeof authClient.signIn).toBe('function');
		expect(typeof authClient.signOut).toBe('function');
		expect(typeof authClient.signUp).toBe('function');
		expect(typeof authClient.useSession).toBe('function');
		expect(typeof signInWithGoogle).toBe('function');
	});
});
