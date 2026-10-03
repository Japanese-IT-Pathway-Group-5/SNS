import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

export interface AuthEnv {
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
}

export function createAuth(d1: D1Database, env?: Partial<Env> | AuthEnv) {
	const db = getDb(d1);
	const authEnv = env as (AuthEnv & Partial<Env>) | undefined;

	const googleClientId = authEnv?.GOOGLE_CLIENT_ID ?? '';
	const googleClientSecret = authEnv?.GOOGLE_CLIENT_SECRET ?? '';

	const trustedOrigins = [
		'http://localhost:5173',
		'http://localhost:5174',
		'http://localhost:4173',
		'http://127.0.0.1:5173',
		'http://127.0.0.1:5174'
	];
	if (authEnv?.BETTER_AUTH_URL && !trustedOrigins.includes(authEnv.BETTER_AUTH_URL)) {
		trustedOrigins.push(authEnv.BETTER_AUTH_URL);
	}

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema
		}),
		secret: authEnv?.BETTER_AUTH_SECRET,
		baseURL: authEnv?.BETTER_AUTH_URL,
		trustedOrigins,
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
			minPasswordLength: 8,
			maxPasswordLength: 128
		},
		socialProviders: {
			google: {
				clientId: googleClientId,
				clientSecret: googleClientSecret,
				enabled: Boolean(googleClientId && googleClientSecret)
			}
		}
	});
}

export const getAuth = createAuth;
export type Auth = ReturnType<typeof createAuth>;
